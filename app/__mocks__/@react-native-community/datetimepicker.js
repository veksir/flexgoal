const React = require('react');

function DateTimePicker({ value, mode, display, onChange, minimumDate, maximumDate }) {
  return React.createElement('View', {
    testID: 'datetimepicker',
    value,
    mode,
    display,
    onChange,
    minimumDate,
    maximumDate,
  });
}

module.exports = DateTimePicker;
module.exports.default = DateTimePicker;
module.exports.DateTimePickerEvent = {};
