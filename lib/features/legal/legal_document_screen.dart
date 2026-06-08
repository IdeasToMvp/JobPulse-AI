import 'package:flutter/material.dart';

import '../../core/legal/legal_content.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class LegalDocumentScreen extends StatelessWidget {
  const LegalDocumentScreen({
    super.key,
    required this.document,
    this.onOpenAlternate,
  });

  final LegalDocument document;
  final VoidCallback? onOpenAlternate;

  static Future<void> openPrivacy(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LegalDocumentScreen(
          document: privacyPolicy,
          onOpenAlternate: () => _openTerms(context),
        ),
      ),
    );
  }

  static Future<void> openTerms(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => LegalDocumentScreen(
          document: termsOfService,
          onOpenAlternate: () => _openPrivacy(context),
        ),
      ),
    );
  }

  static void _openTerms(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LegalDocumentScreen(
          document: termsOfService,
          onOpenAlternate: () => _openPrivacy(context),
        ),
      ),
    );
  }

  static void _openPrivacy(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(
        builder: (_) => LegalDocumentScreen(
          document: privacyPolicy,
          onOpenAlternate: () => _openTerms(context),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final alternateLabel = document.title == privacyPolicy.title
        ? 'Terms of Service'
        : 'Privacy Policy';

    return Scaffold(
      backgroundColor: AppColors.onboardingBackground,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        foregroundColor: AppColors.onboardingTitle,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          document.title,
          style: AppTextStyles.darkGreeting.copyWith(fontSize: 16),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Text(
              'Last updated: ${document.lastUpdated}',
              style: AppTextStyles.darkStatCaption,
            ),
            const SizedBox(height: 12),
            Text(
              document.summary,
              style: AppTextStyles.darkSubtitle.copyWith(height: 1.5),
            ),
            const SizedBox(height: 20),
            _TableOfContents(sections: document.sections),
            const SizedBox(height: 24),
            for (final section in document.sections) ...[
              Text(
                section.title,
                style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
              ),
              const SizedBox(height: 10),
              for (final paragraph in section.paragraphs) ...[
                Text(
                  paragraph,
                  style: AppTextStyles.darkSubtitle.copyWith(height: 1.55),
                ),
                const SizedBox(height: 10),
              ],
              if (section.bullets.isNotEmpty) ...[
                for (final bullet in section.bullets)
                  Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '•  ',
                          style: TextStyle(
                            color: AppColors.secondary,
                            fontSize: 16,
                            height: 1.5,
                          ),
                        ),
                        Expanded(
                          child: Text(
                            bullet,
                            style: AppTextStyles.darkSubtitle.copyWith(
                              height: 1.55,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
              const SizedBox(height: 18),
            ],
            if (onOpenAlternate != null) ...[
              const Divider(color: AppColors.platformsCardBorder),
              const SizedBox(height: 16),
              TextButton(
                onPressed: onOpenAlternate,
                child: Text('Read $alternateLabel'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TableOfContents extends StatelessWidget {
  const _TableOfContents({required this.sections});

  final List<LegalSection> sections;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.platformsCardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ON THIS PAGE',
            style: AppTextStyles.darkCardTag.copyWith(
              color: AppColors.dashboardMuted,
              fontSize: 11,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 10),
          for (final section in sections)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                section.title,
                style: AppTextStyles.featureTitle.copyWith(
                  color: AppColors.primary,
                  fontSize: 14,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
