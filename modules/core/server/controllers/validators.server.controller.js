module.exports.isInteger = function (value) {
  if (!Number.isInteger(value)) {
    return false;
  }
  return true;
};
