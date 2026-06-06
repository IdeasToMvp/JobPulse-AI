import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/models/application_status.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../platforms/models/job_platform.dart';

typedef ManualApplicationCreatedCallback = void Function(
  ApplicationDetail detail,
);

class AddApplicationSheet extends StatefulWidget {
  const AddApplicationSheet({super.key, this.onCreated});

  final ManualApplicationCreatedCallback? onCreated;

  static Future<void> show(
    BuildContext context, {
    ManualApplicationCreatedCallback? onCreated,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => AddApplicationSheet(onCreated: onCreated),
    );
  }

  @override
  State<AddApplicationSheet> createState() => _AddApplicationSheetState();
}

class _AddApplicationSheetState extends State<AddApplicationSheet> {
  final _companyController = TextEditingController();
  final _roleController = TextEditingController();
  final _locationController = TextEditingController();
  final _salaryController = TextEditingController();
  final _roundsController = TextEditingController();
  final _notesController = TextEditingController();

  String _platformId = JobPlatform.all.first.id;
  String _status = 'applied';
  DateTime _appliedAt = DateTime.now();
  String? _workMode;
  bool _submitting = false;

  @override
  void dispose() {
    _companyController.dispose();
    _roleController.dispose();
    _locationController.dispose();
    _salaryController.dispose();
    _roundsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _companyController.text.trim().isNotEmpty &&
      _roleController.text.trim().isNotEmpty;

  Future<void> _pickAppliedDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _appliedAt,
      firstDate: DateTime(2015),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _appliedAt = picked);
    }
  }

  ApplicationUserDetails? _optionalDetails() {
    final location = _locationController.text.trim();
    final salary = _salaryController.text.trim();
    final notes = _notesController.text.trim();
    final roundsRaw = _roundsController.text.trim();
    final rounds = roundsRaw.isEmpty ? null : int.tryParse(roundsRaw);

    final details = ApplicationUserDetails(
      location: location.isEmpty ? null : location,
      salary: salary.isEmpty ? null : salary,
      notes: notes.isEmpty ? null : notes,
      numberOfRounds: rounds,
      workMode: _workMode,
    );
    return details.hasAny ? details : null;
  }

  Future<void> _submit() async {
    if (!_canSubmit || _submitting) return;

    setState(() => _submitting = true);
    try {
      final result = await UserApi.instance.createManualApplication(
        company: _companyController.text.trim(),
        role: _roleController.text.trim(),
        platformId: _platformId,
        status: _status,
        appliedAt: _formatDateInput(_appliedAt),
        details: _optionalDetails(),
      );

      if (!mounted) return;
      AppSyncState.instance.applySyncFromStatusUpdate(result.sync);
      AppSyncState.instance.bumpFeedRevision();
      Navigator.of(context).pop();
      widget.onCreated?.call(result.application);
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save application')),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  String _formatDateInput(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String _formatDisplayDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.88,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          20 + MediaQuery.paddingOf(context).bottom,
        ),
        child: Column(
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
            const SizedBox(height: 16),
            Text(
              'Add application',
              style: AppTextStyles.darkGreeting.copyWith(fontSize: 20),
            ),
            const SizedBox(height: 6),
            Text(
              'Track a role you applied to outside Gmail sync.',
              style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _textField(
                      controller: _companyController,
                      label: 'Company *',
                      hint: 'e.g. Acme Corp',
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    _textField(
                      controller: _roleController,
                      label: 'Role *',
                      hint: 'e.g. Senior Product Manager',
                      onChanged: (_) => setState(() {}),
                    ),
                    const SizedBox(height: 12),
                    Text('Source *', style: AppTextStyles.darkStatCaption),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _platformId,
                      decoration: _inputDecoration(),
                      items: JobPlatform.all
                          .map(
                            (platform) => DropdownMenuItem(
                              value: platform.id,
                              child: Text(platform.label),
                            ),
                          )
                          .toList(),
                      onChanged: _submitting
                          ? null
                          : (value) {
                              if (value != null) {
                                setState(() => _platformId = value);
                              }
                            },
                    ),
                    const SizedBox(height: 12),
                    Text('Status *', style: AppTextStyles.darkStatCaption),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: manualApplicationStatuses.map((status) {
                        final selected = _status == status;
                        return ChoiceChip(
                          label: Text(formatStatusLabel(status)),
                          selected: selected,
                          onSelected: _submitting
                              ? null
                              : (_) => setState(() => _status = status),
                          selectedColor:
                              AppColors.secondary.withValues(alpha: 0.15),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    Text('Applied date *', style: AppTextStyles.darkStatCaption),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _submitting ? null : _pickAppliedDate,
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        side: const BorderSide(color: AppColors.platformsCardBorder),
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(_formatDisplayDate(_appliedAt)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Optional details',
                      style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
                    ),
                    const SizedBox(height: 12),
                    _textField(
                      controller: _locationController,
                      label: 'Location',
                      hint: 'e.g. Bangalore or Remote',
                    ),
                    const SizedBox(height: 12),
                    _textField(
                      controller: _salaryController,
                      label: 'Salary',
                      hint: 'e.g. ₹18–22 LPA',
                    ),
                    const SizedBox(height: 12),
                    _textField(
                      controller: _roundsController,
                      label: 'Number of rounds',
                      hint: 'e.g. 3',
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    ),
                    const SizedBox(height: 12),
                    Text('Work mode', style: AppTextStyles.darkStatCaption),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['remote', 'hybrid', 'onsite'].map((mode) {
                        final selected = _workMode == mode;
                        return ChoiceChip(
                          label: Text(formatStatusLabel(mode)),
                          selected: selected,
                          onSelected: _submitting
                              ? null
                              : (_) => setState(
                                    () => _workMode = selected ? null : mode,
                                  ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    _textField(
                      controller: _notesController,
                      label: 'Notes',
                      hint: 'Recruiter, referral, next step, etc.',
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: !_canSubmit || _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                minimumSize: const Size.fromHeight(48),
              ),
              child: _submitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.white,
                      ),
                    )
                  : const Text('Save application'),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: AppColors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.platformsCardBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.platformsCardBorder),
      ),
    );
  }

  Widget _textField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.darkStatCaption),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          onChanged: onChanged,
          decoration: _inputDecoration().copyWith(hintText: hint),
        ),
      ],
    );
  }
}
