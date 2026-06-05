/// Formats an integer using the Indian numbering system (e.g. 121133 → 1,21,133).
String formatIndianNumber(int value) {
  final negative = value < 0;
  final digits = value.abs().toString();
  if (digits.length <= 3) return negative ? '-$digits' : digits;

  final lastThree = digits.substring(digits.length - 3);
  var rest = digits.substring(0, digits.length - 3);
  final groups = <String>[];

  while (rest.length > 2) {
    groups.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) groups.insert(0, rest);

  final formatted = '${groups.join(',')},$lastThree';
  return negative ? '-$formatted' : formatted;
}

/// Formats numeric portions in a salary string using Indian grouping.
String formatSalaryDisplay(String salary) {
  return salary.replaceAllMapped(RegExp(r'\d{4,}'), (match) {
    return formatIndianNumber(int.parse(match.group(0)!));
  });
}
