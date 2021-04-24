import { NextFunction } from 'express'
import { omit, pick, isObject, isArray, map, flatMap, isString, get, some } from 'lodash'
// import { getConfig, getLog } from '../config'
// import { friendlyFieldName } from './text'

// const config = getConfig()
// const log = getLog()

export const requestLogItems = [
  'method',
  'originalUrl',
  'headers.user-agent',
  'headers.uuid',
  'headers.host',
  'headers.origin',
  'headers.version',
  'uuid',
  'body',
]
// const responseLogItems = ['statusCode', '_hasBody', '_headers.content-length']

export const attachHelpers = (request: Request, resp: Response, next: NextFunction) => {
  g

  request.locals = {}

  // make log helper on every request to ease logging
  request.log = {
    error(...args) {
      logWithRequestContext('error', args)
    },
    warn(...args) {
      logWithRequestContext('warn', args)
    },
    info(...args) {
      logWithRequestContext('info', args)
    },
    verbose(...args) {
      logWithRequestContext('verbose', args)
    },
    debug(...args) {
      logWithRequestContext('debug', args)
    },
    silly(...args) {
      logWithRequestContext('silly', args)
    },
  }
  function logWithRequestContext(level, args) {
    args = args || []
    const request = omit(pick(request, requestLogItems), 'body.password')

    let response = null
    let timeSinceRequestStartMs = 0
    if (resp.finished) {
      // might not have much if anything available depending on when this is called
      response = pick(resp, responseLogItems)
      timeSinceRequestStartMs = Date.now() - request.startDate
    }

    log.log(...[level, args[0] || 'Unknown', Object.assign({ request, response, timeSinceRequestStartMs }, args[1])])
  }

  const dontLogThese = ['/clienterror', '/bugsnag', '/notification/search', '/log']
  if (!dontLogThese.some(x => request.originalUrl.toLowerCase().includes(x))) {
    // request.log.silly('HttpRequestStart')
    resp.on('finish', () => request.log.debug('HttpRequestComplete'))
  }

  // RESPONSE HELPERS
  Object.assign(resp, {
    ok: () => resp.sendStatus(200),

    // 200 range
    created: (msg = { statusMessage: '201: Created' }) => resp.status(201).json(msg),

    noContent: () => resp.status(204).json({ statusMessage: '204: No Content' }),

    // >=300 range
    notFound() {
      const msg = { statusMessage: '404: NotFound' }
      resp.status(404).json(msg)
      request.log.warn(msg.statusMessage)
    },

    notImplemented() {
      const msg = { statusMessage: '501: NotImplemented' }
      resp.status(501).json(msg)
      request.log.warn(msg.statusMessage)
    },

    /**
     * 401 - Unauthorized. You don't have access because you lack authentication.
     */
    unauthorized() {
      const msg = { statusMessage: "401: Unauthorized - You don't have access because you're not logged in." }
      resp.status(401).json(msg)
      request.log.debug(msg.statusMessage)
    },

    forbidden(message = '') {
      const body = {
        statusMessage: `403: Forbidden - You don't have access.`,
      }

      if (message) {
        body['message'] = message
      }

      resp.status(403).json(body)
      request.log.info(body.statusMessage)
    },

    forbiddenAppVersion() {
      const msg = {
        message: 'Please update the app to the latest version in the App Store or you may experience problems',
      }
      resp.status(501).json(msg)
      request.log.info(msg.message)
    },

    internalServerError() {
      const msg = {
        message: 'Something went wrong',
      }
      resp.status(500).json(msg)
      request.log.info(msg.message)
    },

    badRequest: errorOrResponse => {
      function send(result) {
        if (resp._headerSent) {
          request.log.warn('Error thrown AFTER request headers sent so client did not get the error')
          return
        }
        if (isObject(result)) {
          result['metadata'] = (errorOrResponse || {}).metadata
          result['uuid'] = request.uuid // always attach someone to lookup this problem if possible (ui can display if they want)
        }
        resp.status(400).send(result)
      }

      const isMongooseValidationError = errorOrResponse.name === 'ValidationError'
      const isMongooseVersionError = errorOrResponse.name === 'VersionError'
      const isUnknownError =
        (errorOrResponse instanceof Error && (!isMongooseValidationError && !isMongooseVersionError)) ||
        (isArray(errorOrResponse) &&
          errorOrResponse.some(x => x instanceof MongooseError && x.name !== 'ValidationError'))
      const isMongooseValidationErrorArray =
        isArray(errorOrResponse) && errorOrResponse.length && errorOrResponse[0].name === 'ValidationError'

      let validationErrors: { index?: number; fieldPath: string; message: string }[] = []
      if (isMongooseValidationError) {
        validationErrors = mapMongooseObjectErrors(errorOrResponse)
      } else if (isMongooseValidationErrorArray) {
        validationErrors = flatMap(errorOrResponse, x => mapMongooseObjectErrors(x, x.index))
      }

      function mapMongooseObjectErrors(
        objectErrors: MongooseError.ValidationError,
        index?: number
      ): { index?: number; fieldPath: string; message: string }[] {
        if (!Object.keys(objectErrors.errors || {})) {
          // some sort of unhandled validation error
          request.log.warn('Unhandled mongoose validation error', objectErrors)
          send({ message: 'Please check your input and try again' })
          return []
        }

        return map(objectErrors.errors, (error, path) => ({
          index, // for the case of array operation errors
          fieldPath: path,
          message: (() => {
            switch (error.kind) {
              case 'unique':
              case 'Duplicate value':
                return `The ${errorFriendlyFieldName(path)} '${error.value}' already exists`
              case 'user defined':
                return error.message
              case 'required':
                if (/Path `[^`]+` is required./.test(error['properties'].message)) {
                  return `${errorFriendlyFieldName(path)} is required.`
                }
                return error.message
              case 'maxlength':
              case 'minlength': {
                const isMax = error.kind === 'maxlength'
                if (/PATH.*?VALUE.*?is.*?than the.*?allowed length/.test(error['properties'].message)) {
                  // not customized, we can do better than the default one
                  return `${errorFriendlyFieldName(path)} has ${isMax ? 'more' : 'less'} than the ${isMax ? 'maximum' : 'minimum'
                    } allowed characters of ${isMax ? error['properties'].maxlength : error['properties'].minlength}`
                }
                return error.message
              }
              default:
                return `${errorFriendlyFieldName(path)} is invalid`
            }
          })(),
        }))
      }

      let message = `An unknown error has occurred, please try again. If the problem persists please contact us referring to error code: ${request.uuid}`

      if (isMongooseVersionError) {
        message =
          'Unable to find or update resource. It may no longer exist or you may have an out of date version. Please refresh and try again.'
      }

      // If we have an error that has a message, but no enumerated errors, then send the message as the response.
      if (errorOrResponse.message && !some(errorOrResponse.errors)) {
        errorOrResponse = errorOrResponse.message
      }

      if (isString(errorOrResponse)) {
        send({ message: errorOrResponse })
      } else if (config.nodeEnv === 'development' || config.nodeEnv === 'localhost') {
        let errorDetails = errorOrResponse
        if (errorOrResponse instanceof Error) {
          errorDetails = pick(errorOrResponse, 'message', 'arguments', 'type', 'name', 'item', 'stack', 'errors')
        }
        const body = { validationErrors, errorDetails }
        if (!validationErrors) {
          Object.assign(body, { message })
        }
        send(body)
      } else if (isMongooseValidationError || isMongooseValidationErrorArray) {
        // production or unknown environment, dev above
        send({ validationErrors })
      } else if (isUnknownError) {
        send({ message })
      } else if (isMongooseVersionError) {
        send({ message })
      } else {
        send(errorOrResponse)
      }

      const logMeta = {
        validationErrors,
        errorString: isString(errorOrResponse) ? errorOrResponse : undefined,
        errorObj: isObject(errorOrResponse) ? errorOrResponse : undefined,
      }

      request.log.warn(`400: BadRequest - ${(errorOrResponse || 'Unknown').toString()}`, logMeta)
    },
  })

  next()
}

function errorFriendlyFieldName(fieldPath) {
  fieldPath = fieldPath || 'Your Request'

  // for nice array field error messages
  // ex: kids.0.birthday => kids 1 birthday
  const arrayMatch = /\.(\d+)\./g.exec(fieldPath)
  if (arrayMatch && arrayMatch[0]) {
    fieldPath = fieldPath.replace(arrayMatch[0], ` ${parseInt(arrayMatch[1]) + 1} `)
  }

  return friendlyFieldName(fieldPath)
}


// https://github.com/expressjs/generator/issues/78#issuecomment-232890226
// express requires error handles to have next
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const notFoundHandler = (_err, _req, resp, next) => {
  resp.notFound()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err, _req, res, next) => {
  if (typeof res.badRequest === 'function') {
    if (err instanceof Error) {
      log.error(err.stack)
    }

    return res.badRequest(err)
  }

  if (err instanceof SyntaxError && err['status'] >= 400 && err['status'] < 500 && err.message.includes('JSON')) {
    return res.status(400).json({ message: err.message })
  }

  throw err
}

export const logClientError = (req, resp) => {
  const request = pick(req, requestLogItems.filter(x => x !== 'body'))
  const deviceInfo = req.body.deviceInfo
  const clientErrorInfo = req.body.clientErrorInfo || []

  // need to do some fudging here or else ES wont be happy since there will be type mismatches and we don't know exactly what the client will send
  let sliceOffset = 0
  const clientMessage = clientErrorInfo[0]
  const error = get(clientErrorInfo, '1.stack')

  if (isString(clientMessage)) {
    sliceOffset += 1
  }

  if (error) {
    sliceOffset += 1
  }

  log.warn('Client Error', {
    clientMessage,
    deviceInfo,
    request,
    error,
    otherArgs: Object.assign({}, clientErrorInfo.slice(sliceOffset)),
  })

  resp.noContent()
}

export const bugSnag = (req, resp) => {
  // limit log field creation to prevent too many fields from being created in ES
  const stackTrace = get(req.body, 'error.stackTrace')
  if (isArray(stackTrace)) {
    req.body.error.stackStrace = stackTrace.map(x => {
      if (x.code && isObject(x.code)) {
        x.code = map(x.code, (code, lineNumber) => `${lineNumber} ${code}`).join('\n')
      }
      return x
    })
  }

  log.warn('Bugsnag Error', req.body)
  resp.noContent()
}
