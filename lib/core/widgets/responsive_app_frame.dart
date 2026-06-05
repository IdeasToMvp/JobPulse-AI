import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Max content width for phone-first layouts on tablet/web.
const double kAppMaxContentWidth = 480;

/// Extra top inset for web where [SafeArea] is usually zero.
const double kWebContentTopPadding = 20;

/// Centers app content on wide viewports (web/desktop) with a phone-like width.
class ResponsiveAppFrame extends StatelessWidget {
  const ResponsiveAppFrame({
    super.key,
    required this.child,
    this.maxWidth = kAppMaxContentWidth,
  });

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final screenHeight = MediaQuery.sizeOf(context).height;

    if (screenWidth <= maxWidth) {
      return child;
    }

    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: Center(
        child: SizedBox(
          width: maxWidth,
          height: screenHeight,
          child: kIsWeb
              ? DecoratedBox(
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    border: Border.symmetric(
                      vertical: BorderSide(
                        color: Colors.black.withValues(alpha: 0.06),
                      ),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 32,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: child,
                )
              : child,
        ),
      ),
    );
  }
}

/// Bottom sheet that respects [kAppMaxContentWidth] on wide viewports.
Future<T?> showAppBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  Color? backgroundColor,
  bool isScrollControlled = false,
  ShapeBorder? shape,
  bool useSafeArea = true,
}) {
  final wide = MediaQuery.sizeOf(context).width > kAppMaxContentWidth;

  return showModalBottomSheet<T>(
    context: context,
    backgroundColor: backgroundColor,
    isScrollControlled: isScrollControlled,
    useSafeArea: useSafeArea,
    shape: shape,
    constraints: wide
        ? const BoxConstraints(maxWidth: kAppMaxContentWidth)
        : null,
    builder: builder,
  );
}
