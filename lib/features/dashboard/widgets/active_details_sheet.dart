import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
typedef DetailsUpdateCallback = void Function(ApplicationDetail detail);

enum ActiveDetailsMode { statusWithDetails, editOnly }

class ActiveDetailsSheet extends StatefulWidget {
  const ActiveDetailsSheet({
    super.key,
    required this.application,
    this.mode = ActiveDetailsMode.statusWithDetails,
    this.targetStatus = 'active',
    this.onUpdated,
  });

  final JobApplication application;
  final ActiveDetailsMode mode;
  final String targetStatus;
  final DetailsUpdateCallback? onUpdated;

  static Future<void> show(
    BuildContext context, {
    required JobApplication application,
    ActiveDetailsMode mode = ActiveDetailsMode.statusWithDetails,
    String targetStatus = 'active',
    DetailsUpdateCallback? onUpdated,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ActiveDetailsSheet(
        application: application,
        mode: mode,
        targetStatus: targetStatus,
        onUpdated: onUpdated,
      ),
    );
  }

  @override
  State<ActiveDetailsSheet> createState() => _ActiveDetailsSheetState();
}

class _ActiveDetailsSheetState extends State<ActiveDetailsSheet> {
  late final TextEditingController _roleController;
  late final TextEditingController _locationController;
  late final TextEditingController _salaryController;
  late final TextEditingController _roundsController;
  late final TextEditingController _notesController;
  String? _workMode;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final user = widget.application.userDetails;
    final extracted = widget.application.extractedDetails;

    _roleController = TextEditingController(
      text: widget.application.role ?? extracted?.role ?? '',
    );
    _locationController = TextEditingController(
      text: user?.location ?? extracted?.location ?? '',
    );
    _salaryController = TextEditingController(
      text: user?.salary ?? extracted?.salary ?? '',
    );
    _roundsController = TextEditingController(
      text: user?.numberOfRounds?.toString() ?? '',
    );
    _notesController = TextEditingController(text: user?.notes ?? '');
    _workMode = user?.workMode;
  }

  @override
  void dispose() {
    _roleController.dispose();
    _locationController.dispose();
    _salaryController.dispose();
    _roundsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  ApplicationUserDetails? _buildDetailsPayload() {
    final roundsRaw = _roundsController.text.trim();
    final rounds = int.tryParse(roundsRaw);

    final details = ApplicationUserDetails(
      location: _locationController.text.trim(),
      salary: _salaryController.text.trim(),
      numberOfRounds: rounds,
      workMode: _workMode,
      notes: _notesController.text.trim(),
    );

    return details.hasAny ? details : null;
  }

  Future<void> _submit({required bool includeDetails}) async {
    setState(() => _submitting = true);

    try {
      if (widget.mode == ActiveDetailsMode.editOnly) {
        final roundsRaw = _roundsController.text.trim();
        final details = ApplicationUserDetails(
          location: _locationController.text.trim(),
          salary: _salaryController.text.trim(),
          numberOfRounds:
              roundsRaw.isEmpty ? null : int.tryParse(roundsRaw),
          workMode: _workMode,
          notes: _notesController.text.trim(),
        );
        final roleText = _roleController.text.trim();
        final result = await UserApi.instance.updateApplicationDetails(
          widget.application.id,
          details,
          role: roleText.isNotEmpty ? roleText : null,
        );
        widget.onUpdated?.call(result.application);
        if (mounted) Navigator.of(context).pop();
        return;
      }

      final result = await UserApi.instance.updateApplicationStatus(
        widget.application.id,
        widget.targetStatus,
        details: includeDetails ? _buildDetailsPayload() : null,
      );
      AppSyncState.instance.applySyncFromStatusUpdate(result.sync);
      AppSyncState.instance.bumpFeedRevision();
      widget.onUpdated?.call(result.application);
      if (mounted) {
        Navigator.of(context).pop();
        Navigator.of(context).pop();
      }
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.mode == ActiveDetailsMode.editOnly
                ? 'Failed to update details'
                : 'Failed to update status',
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditOnly = widget.mode == ActiveDetailsMode.editOnly;
    final maxHeight = MediaQuery.sizeOf(context).height * 0.85;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.paddingOf(context).bottom,
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.loginDivider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              isEditOnly ? 'Job details' : 'Add details (optional)',
              style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
            ),
            const SizedBox(height: 4),
            Text(
              widget.application.company,
              style: AppTextStyles.darkSubtitle,
            ),
            if (!isEditOnly) ...[
              const SizedBox(height: 4),
              Text(
                'Help track this role — all fields are optional.',
                style: AppTextStyles.darkStatCaption,
              ),
            ],
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _field(
                      label: 'Role',
                      controller: _roleController,
                      hint: 'e.g. Software Engineer',
                    ),
                    const SizedBox(height: 12),
                    _field(
                      label: 'Location',
                      controller: _locationController,
                      hint: 'e.g. Bangalore or Remote',
                    ),
                    const SizedBox(height: 12),
                    _field(
                      label: 'Salary',
                      controller: _salaryController,
                      hint: 'e.g. ₹18–22 LPA',
                    ),
                    const SizedBox(height: 12),
                    _field(
                      label: 'Number of rounds',
                      controller: _roundsController,
                      hint: 'e.g. 3',
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    const SizedBox(height: 12),
                    Text('Work mode', style: AppTextStyles.darkStatCaption),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final mode in const ['remote', 'hybrid', 'onsite'])
                          _workModeChip(mode),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _field(
                      label: 'Notes',
                      controller: _notesController,
                      hint: 'Recruiter, next step, etc.',
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (isEditOnly) ...[
              FilledButton(
                onPressed: _submitting ? null : () => _submit(includeDetails: true),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.white,
                        ),
                      )
                    : const Text('Save'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: _submitting ? null : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
            ] else ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _submitting
                          ? null
                          : () => _submit(includeDetails: false),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text('Skip'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _submitting
                          ? null
                          : () => _submit(includeDetails: true),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.white,
                              ),
                            )
                          : const Text('Save'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _field({
    required String label,
    required TextEditingController controller,
    required String hint,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.darkStatCaption),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTextStyles.darkStatCaption,
            filled: true,
            fillColor: AppColors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.platformsCardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.platformsCardBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary),
            ),
          ),
        ),
      ],
    );
  }

  Widget _workModeChip(String mode) {
    final selected = _workMode == mode;
    final label = mode[0].toUpperCase() + mode.substring(1);

    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: _submitting
          ? null
          : (value) {
              setState(() {
                _workMode = value ? mode : null;
              });
            },
      selectedColor: AppColors.primary.withValues(alpha: 0.12),
      checkmarkColor: AppColors.primary,
      labelStyle: AppTextStyles.featureTitle.copyWith(
        fontSize: 13,
        color: selected ? AppColors.primary : null,
      ),
      side: BorderSide(
        color: selected
            ? AppColors.primary.withValues(alpha: 0.45)
            : AppColors.platformsCardBorder,
      ),
    );
  }
}
