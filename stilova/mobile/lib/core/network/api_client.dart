import 'package:dio/dio.dart';

class StilovaApiClient {
  late final Dio _dio;

  StilovaApiClient({String? baseUrl, String? authToken}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? 'https://api.stilova.com/api/v1',
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      ),
    );

    // Register logging interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          print('[📡 Stilova Network Request] ${options.method} ${options.uri}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          print('[📦 Stilova Network Response] Status: ${response.statusCode}');
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          print('[❌ Stilova Network Error] ${error.message} - ${error.response?.data}');
          return handler.next(error);
        },
      ),
    );
  }

  Dio get instance => _dio;

  // General GET proxy
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _parseException(e);
    }
  }

  // General POST proxy
  Future<Response> post(String path, {dynamic data}) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw _parseException(e);
    }
  }

  // Exception parser matching our backend exception filter formatting
  Exception _parseException(DioException e) {
    if (e.response != null && e.response?.data != null) {
      final data = e.response!.data as Map<String, dynamic>;
      final errorMessage = data['message'] ?? 'Erreur réseau indéterminée.';
      return Exception(errorMessage);
    }
    return Exception(e.message ?? 'Impossible de contacter les serveurs de Stilova.');
  }
}
