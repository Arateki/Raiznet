export class InvalidSignatureError extends Error {
  readonly code = 'INVALID_SIGNATURE'
  constructor(deviceId: string) {
    super(`Invalid signature for device ${deviceId}`)
  }
}

export class DeviceNotFoundError extends Error {
  readonly code = 'DEVICE_NOT_FOUND'
  constructor(deviceId: string) {
    super(`Device not found: ${deviceId}`)
  }
}

export class InvalidPayloadError extends Error {
  readonly code = 'INVALID_PAYLOAD'
  constructor(detail: string) {
    super(`Invalid payload: ${detail}`)
  }
}
