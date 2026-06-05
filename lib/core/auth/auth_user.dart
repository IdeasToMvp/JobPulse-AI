class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.name,
    this.picture,
  });

  final String id;
  final String email;
  final String name;
  final String? picture;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      picture: json['picture'] as String?,
    );
  }
}
