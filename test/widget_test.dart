import 'package:flutter_test/flutter_test.dart';

import 'package:jobsync/main.dart';

void main() {
  testWidgets('app loads splash', (WidgetTester tester) async {
    await tester.pumpWidget(const JobSyncApp());
    expect(find.text('JobPulse AI'), findsOneWidget);
    expect(find.text('ANALYZING INBOXES...'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
  });
}
