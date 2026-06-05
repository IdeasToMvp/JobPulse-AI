import 'dart:html' as html;

void clearOAuthQueryFromBrowserUrl() {
  final uri = Uri.base;
  if (uri.queryParameters.isEmpty) return;
  final cleaned = uri.replace(queryParameters: {}, fragment: '');
  html.window.history.replaceState(null, '', cleaned.toString());
}
