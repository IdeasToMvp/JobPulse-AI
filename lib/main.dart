import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

import 'core/config/app_config.dart';
import 'core/theme/app_colors.dart';
import 'core/widgets/responsive_app_frame.dart';
import 'features/splash/splash_screen.dart';

void main() {
  if (kIsWeb) {
    usePathUrlStrategy();
  }
  if (kDebugMode) {
    debugPrint(
      'JobPulse API → ${AppConfig.apiBaseUrl}'
      '${AppConfig.isUsingLocalBackend ? ' (local backend)' : ''}',
    );
  }
  runApp(const JobSyncApp());
}

class JobSyncApp extends StatelessWidget {
  const JobSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'JobPulse AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: AppColors.backgroundLight,
      ),
      builder: (context, child) {
        return ResponsiveAppFrame(
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: const SplashScreen(),
    );
  }
}
