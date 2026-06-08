import 'dart:io';

import 'package:http/http.dart' as http;

bool isBackendConnectionError(Object error) {
  if (error is SocketException) return true;
  if (error is http.ClientException) {
    final message = error.message.toLowerCase();
    return message.contains('connection refused') ||
        message.contains('failed host lookup') ||
        message.contains('network is unreachable') ||
        message.contains('connection timed out') ||
        message.contains('no route to host');
  }

  final message = error.toString().toLowerCase();
  return message.contains('socketexception') ||
      message.contains('connection refused') ||
      message.contains('failed host lookup');
}
