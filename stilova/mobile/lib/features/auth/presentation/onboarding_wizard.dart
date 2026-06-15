import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class OnboardingWizard extends StatefulWidget {
  const OnboardingWizard({super.key});

  @override
  State<OnboardingWizard> createState() => _OnboardingWizardState();
}

class _OnboardingWizardState extends State<OnboardingWizard> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _onboardingSteps = [
    {
      "title": "Le stylet qui grave ton histoire",
      "subtitle": "Explorez des contes mythologiques, des romans afrofuturistes et des aventures interactives panafricaines.",
      "icon": Icons.edit_note_outlined,
      "color": Color(0xFF1E293B) // Dark Cosmic Slate
    },
    {
      "title": "Récits Interactifs d'Afrique",
      "subtitle": "Influencez le cours du récit en incarnant des guerriers, des reines mythiques ou des citoyens du Dakar du futur.",
      "icon": Icons.navigation_outlined,
      "color": Color(0xFF8C3E15) // Terracotta Clay
    },
    {
      "title": "La Voix des Nouveaux Griots",
      "subtitle": "Exprimez votre créativité dans un studio intuitif et faites voyager vos écrits à travers le monde.",
      "icon": Icons.rate_review_outlined,
      "color": Color(0xFF065F46) // West African Emerald
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView.builder(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentPage = index;
          });
        },
        itemCount: _onboardingSteps.length,
        itemBuilder: (context, index) {
          final step = _onboardingSteps[index];
          return Container(
            color: step["color"],
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Colors.amber, Colors.orangeAccent],
                  ).createShader(bounds),
                  child: Icon(
                    step["icon"],
                    size: 96,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 40),
                Text(
                  step["title"],
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Playfair Display',
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  step["subtitle"],
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.85),
                    height: 1.5,
                  ),
                ),
              ],
            ),
          );
        },
      ),
      bottomSheet: Container(
        color: _onboardingSteps[_currentPage]["color"],
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Page indicators dots
            Row(
              children: List.generate(
                _onboardingSteps.length,
                (index) => Container(
                  margin: const EdgeInsets.only(right: 6),
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    color: _currentPage == index ? Colors.amber : Colors.white24,
                  ),
                ),
              ),
            ),
            
            // Interaction button
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black80,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              onPressed: () {
                if (_currentPage < _onboardingSteps.length - 1) {
                  _pageController.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                  );
                } else {
                  context.go('/discover');
                }
              },
              child: Text(
                _currentPage == _onboardingSteps.length - 1 ? 'Commencer' : 'Suivant',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}
