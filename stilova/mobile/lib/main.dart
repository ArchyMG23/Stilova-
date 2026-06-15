import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'routes/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: StilovaApp(),
    ),
  );
}

class StilovaApp extends ConsumerWidget {
  const StilovaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterPrv);

    return MaterialApp.router(
      title: 'Stilova',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      
      // 🏺 THEME TECHNIQUE DE PRESTIGE (CRÉPUSCULE CHALEUREUX)
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFFAF8F5), // Sable chaud de l'Afrique de l'Ouest
        primaryColor: const Color(0xFF8C3E15), // Argile cuite / Terracotta
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF8C3E15),
          secondary: Color(0xFFD97706), // Ambre brillant
          surface: Colors.white,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
        ),
        textTheme: GoogleFonts.interTextTheme().copyWith(
          displayLarge: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
          bodyLarge: GoogleFonts.inter(
            height: 1.6,
            color: const Color(0xFF334155),
          ),
        ),
      ),
      
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Ardoise Cosmique Profonde / Onyx
        primaryColor: const Color(0xFFF97316), // Orange de feu d'Afrique subsaharienne
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFF97316),
          secondary: Color(0xFFFBBF24), // Ambre
          surface: Color(0xFF1E293B),
          onPrimary: Colors.black,
          onSecondary: Colors.black,
        ),
        textTheme: GoogleFonts.interTextTheme().copyWith(
          displayLarge: GoogleFonts.playfairDisplay(
            fontWeight: FontWeight.bold,
            color: const Color(0xFFF8FAFC),
          ),
          bodyLarge: GoogleFonts.inter(
            height: 1.6,
            color: const Color(0xFFE2E8F0),
          ),
        ),
      ),
      themeMode: ThemeMode.system, // Adapt to OS configuration
    );
  }
}
