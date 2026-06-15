import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/presentation/onboarding_wizard.dart';
import '../features/discover/presentation/explorer_screen.dart';
import '../features/reader/presentation/reading_panel.dart';

// Provider instantiations for GoRouter
final appRouterPrv = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/onboarding',
    
    // Dynamic guard redirects (e.g. check login authentication states)
    redirect: (context, state) {
      // Return null to continue routing uninterruptedly
      return null;
    },
    
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingWizard(),
      ),
      GoRoute(
        path: '/discover',
        builder: (context, state) => const ExplorerScreen(),
      ),
      GoRoute(
        path: '/reader/:storyId',
        builder: (context, state) {
          final storyId = state.pathParameters['storyId'] ?? 'story_afrofuturism_dakar';
          return ReadingPanel(storyId: storyId);
        },
      ),
    ],
    
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Arrivée dans une ruelle inconnue : ${state.error}'),
      ),
    ),
  );
});
