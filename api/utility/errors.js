exports.UserWithThisEmailAlreadyExistsError = class UserWithThisEmailAlreadyExistsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserWithThisEmailAlreadyExistsError';
  }
}

exports.InvalidUserDetailsError = class InvalidUserDetailsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidUserDetailsError';
  }
}

exports.NotAuthorisedError = class NotAuthorisedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotAuthorisedError';
  }
}

exports.NoTokenProvidedError = class NoTokenProvidedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoTokenProvidedError';
  }
}

exports.TokenExpiredError = class TokenExpiredError extends Error { 
  constructor(message) {
    super(message);
    this.name = 'TokenExpiredError';
  }
}

exports.UserNotVerifiedError = class UserNotVerifiedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotVerifiedError';
  }
}

exports.UserNotFoundError = class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

exports.NoVerificationHasBeenRequestedError = class NotVerificationHasBeenRequestedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotVerificationHasBeenRequestedError';
  }
}

