/// -------------------------------------------------------------
/// STILOVA FLUTTER API INTEGRATION CONTRACT - PRODUCTION READY
/// -------------------------------------------------------------
/// Ce fichier sert de contrat officiel consommable directement par les développeurs Flutter.
/// Il implémente les modèles de données de sérialisation d'après DTO et un client API
/// robuste gérant le Bearer JWT, les requêtes unifiées, et le décodage d'erreurs normées.
///
/// Dépendances d'usage recommandées dans pubspec.yaml:
///   dependencies:
///     http: ^1.2.0
///

import 'dart:convert';
import 'package:http/http.dart' as http;

/// =============================================================
/// 1. EXCEPTION & NORMED ERROR MODELS
/// =============================================================

class StilovaApiException implements Exception {
  final int statusCode;
  final String message;
  final String errorCode;
  final List<String> details;

  StilovaApiException({
    required this.statusCode,
    required this.message,
    required this.errorCode,
    required this.details,
  });

  factory StilovaApiException.fromRawJson(int statusCode, String source) {
    try {
      final Map<String, dynamic> json = jsonDecode(source);
      final errorSection = json['error'] as Map<String, dynamic>? ?? {};
      return StilovaApiException(
        statusCode: statusCode,
        message: json['message'] ?? 'Erreur d\'appel serveur innomée.',
        errorCode: errorSection['code'] ?? 'UNKNOWN_ERROR',
        details: List<String>.from(errorSection['details'] ?? []),
      );
    } catch (_) {
      return StilovaApiException(
        statusCode: statusCode,
        message: 'Impossible de décoder le payload d\'erreur du serveur.',
        errorCode: 'PARSE_FAILURE',
        details: [source],
      );
    }
  }

  @override
  String toString() => 'StilovaApiException [$errorCode ($statusCode)]: $message\nDétails: ${details.join(", ")}';
}

/// =============================================================
/// 2. TRANSIT DATA MODELS (FLUTTER CLIENT COMPATIBLE)
/// =============================================================

class StilovaUser {
  final String uid;
  final String email;
  final String displayName;
  final String role;
  final List<String> permissions;
  final String? bio;
  final String? avatarUrl;

  StilovaUser({
    required this.uid,
    required this.email,
    required this.displayName,
    required this.role,
    required this.permissions,
    this.bio,
    this.avatarUrl,
  });

  factory StilovaUser.fromJson(Map<String, dynamic> json) {
    return StilovaUser(
      uid: json['uid'] ?? '',
      email: json['email'] ?? '',
      displayName: json['displayName'] ?? '',
      role: json['role'] ?? 'READER',
      permissions: List<String>.from(json['permissions'] ?? []),
      bio: json['bio'],
      avatarUrl: json['avatarUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'role': role,
      'permissions': permissions,
      'bio': bio,
      'avatarUrl': avatarUrl,
    };
  }
}

class Story {
  final String id;
  final String title;
  final String description;
  final String genre;
  final String? authorName;
  final bool isInteractive;
  final List<String> tags;

  Story({
    required this.id,
    required this.title,
    required this.description,
    required this.genre,
    this.authorName,
    required this.isInteractive,
    required this.tags,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      genre: json['genre'] ?? '',
      authorName: json['authorName'],
      isInteractive: json['isInteractive'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'genre': genre,
      'isInteractive': isInteractive,
      'tags': tags,
    };
  }
}

class Chapter {
  final String id;
  final String storyId;
  final String title;
  final String content;
  final bool isRoot;

  Chapter({
    required this.id,
    required this.storyId,
    required this.title,
    required this.content,
    required this.isRoot,
  });

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      id: json['id'] ?? '',
      storyId: json['storyId'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      isRoot: json['isRoot'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'storyId': storyId,
      'title': title,
      'content': content,
      'isRoot': isRoot,
    };
  }
}

class NarrativeChoice {
  final String id;
  final String sourceChapterId;
  final String destinationChapterId;
  final String text;

  NarrativeChoice({
    required this.id,
    required this.sourceChapterId,
    required this.destinationChapterId,
    required this.text,
  });

  factory NarrativeChoice.fromJson(Map<String, dynamic> json) {
    return NarrativeChoice(
      id: json['id'] ?? '',
      sourceChapterId: json['sourceChapterId'] ?? '',
      destinationChapterId: json['destinationChapterId'] ?? '',
      text: json['text'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sourceChapterId': sourceChapterId,
      'destinationChapterId': destinationChapterId,
      'text': text,
    };
  }
}

/// =============================================================
/// 3. SECURE CENTRAL CLIENT SERVICE
/// =============================================================

class StilovaApiClient {
  final String baseUrl;
  String? _accessToken;

  StilovaApiClient({required this.baseUrl});

  /// Injecte manuellement le jeton d'authentification suite au Login/Register
  void setAuthToken(String token) {
    _accessToken = token;
  }

  /// Reset session lors d'un logout
  void clearSession() {
    _accessToken = null;
  }

  /// En-têtes HTTP de requêtes unifiées
  Map<String, String> _getHeaders() {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    return headers;
  }

  /// Parse & normalisation des codes de retour HTTP
  dynamic _processResponse(http.Response response) {
    final int status = response.statusCode;
    if (status >= 200 && status < 300) {
      final decoded = jsonDecode(response.body);
      return decoded['data'] ?? decoded;
    } else {
      throw StilovaApiException.fromRawJson(status, response.body);
    }
  }

  /// =============================================================
  /// HTTP VERBS METHOD IMPLEMENTATIONS
  /// =============================================================

  Future<dynamic> get(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.get(uri, headers: _getHeaders());
    return _processResponse(response);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.post(
      uri, 
      headers: _getHeaders(), 
      body: jsonEncode(body)
    );
    return _processResponse(response);
  }

  Future<dynamic> patch(String path, Map<String, dynamic> body) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.patch(
      uri, 
      headers: _getHeaders(), 
      body: jsonEncode(body)
    );
    return _processResponse(response);
  }

  Future<dynamic> delete(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final response = await http.delete(uri, headers: _getHeaders());
    return _processResponse(response);
  }

  /// =============================================================
  /// MODULE: AUTH LOGICS
  /// =============================================================

  Future<Map<String, dynamic>> login(String email, String password) async {
    final Map<String, dynamic> payload = {
      'email': email,
      'password': password,
    };
    final response = await post('/auth/login', payload);
    final String token = response['accessToken'] ?? '';
    if (token.isNotEmpty) {
      setAuthToken(token);
    }
    return response;
  }

  Future<StilovaUser> register({
    required String email,
    required String password,
    required String preferredMode,
    required List<String> genres,
  }) async {
    final payload = {
      'email': email,
      'password': password,
      'preferredMode': preferredMode,
      'genres': genres,
    };
    final response = await post('/auth/register', payload);
    return StilovaUser.fromJson(response);
  }

  Future<void> logout() async {
    await post('/auth/logout', {});
    clearSession();
  }

  /// =============================================================
  /// MODULE: STORIES RETRIEVALS
  /// =============================================================

  Future<List<Story>> fetchStories({
    int page = 1,
    int limit = 20,
    String? sort,
    String? genre,
  }) async {
    String query = '?page=$page&limit=$limit';
    if (sort != null) query += '&sort=$sort';
    if (genre != null) query += '&genre=$genre';

    final response = await get('/stories$query');
    final List list = response is List ? response : (response['data'] ?? []);
    return list.map((item) => Story.fromJson(item)).toList();
  }

  Future<Story> createStory(Story story) async {
    final payload = story.toJson();
    final response = await post('/stories', payload);
    return Story.fromJson(response);
  }

  /// =============================================================
  /// MODULE: CO-WRITER AI PLUMES APIs
  /// =============================================================

  Future<String> correctText(String rawText) async {
    final response = await post('/ai/correct', {'text': rawText});
    // Conforme à la clef d'OpenAPI Dto corrigé
    return response['correctedText'] ?? '';
  }

  Future<String> generateSummary(String storyText) async {
    final response = await post('/ai/summarize', {'text': storyText});
    return response['summary'] ?? '';
  }
}
