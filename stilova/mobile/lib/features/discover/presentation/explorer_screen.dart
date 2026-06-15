import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ExplorerScreen extends StatefulWidget {
  const ExplorerScreen({super.key});

  @override
  State<ExplorerScreen> createState() => _ExplorerScreenState();
}

class _ExplorerScreenState extends State<ExplorerScreen> {
  final List<Map<String, dynamic>> _featuredStories = [
    {
      "id": "story_afrofuturism_dakar",
      "title": "Dakar 2146 : Les Ombres du Walo",
      "author": "Yasmine Diagne (Griotte Future)",
      "category": "Afrofuturisme",
      "snippet": "Dans un Sénégal cyberpunk alimenté par le bio-miel d’acacia, un départeur de données pourchasse l'androïde royal rebelle...",
      "plumCount": 5,
    },
    {
      "id": "story_mali_soundiata",
      "title": "La Flèche de Soundiata",
      "author": "Amadou Konaré",
      "category": "Épopée Historique",
      "snippet": "L’empire du Mali revit à travers les yeux d’un jeune archiviste découvrant la charte secrète de Kouroukan Fouga.",
      "plumCount": 4,
    }
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'STILOVA',
          style: TextStyle(
            fontFamily: 'Playfair Display',
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // HEADING BANNER
            const Text(
              'Parcourir les Royaumes',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 15),

            // HORIZONTAL CATEGORY SELECTOR
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildCategoryBadge('Tout', true),
                  _buildCategoryBadge('Afrofuturisme', false),
                  _buildCategoryBadge('Fantastique', false),
                  _buildCategoryBadge('Guerre & Épopées', false),
                  _buildCategoryBadge('Romances', false),
                ],
              ),
            ),
            const SizedBox(height: 25),

            // HIGHLIGHTED NOVELS PANEL
            const Text(
              'À la Une cette Saison',
              style: TextStyle(
                fontFamily: 'Playfair Display',
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.amber,
              ),
            ),
            const SizedBox(height: 12),

            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _featuredStories.length,
              itemBuilder: (context, index) {
                final story = _featuredStories[index];
                return GestureDetector(
                  onTap: () {
                    context.go('/reader/${story["id"]}');
                  },
                  child: Card(
                    elevation: 1,
                    margin: const EdgeInsets.only(bottom: 18),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                child: Text(
                                  story["category"],
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.amber,
                                  ),
                                ),
                              ),
                              Row(
                                children: List.generate(
                                  story["plumCount"],
                                  (index) => const Icon(
                                    Icons.create, // Stylus/Plum icon
                                    size: 14,
                                    color: Colors.amber,
                                  ),
                                ),
                              )
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            story["title"],
                            style: const TextStyle(
                              fontFamily: 'Playfair Display',
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Par ${story["author"]}',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            story["snippet"],
                            style: const TextStyle(
                              fontSize: 14,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Row(
                            children: [
                              Icon(Icons.menu_book, size: 16, color: Colors.grey),
                              SizedBox(width: 6),
                              Text('12 Chapitres', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              SizedBox(width: 15),
                              Icon(Icons.remove_red_eye_outlined, size: 16, color: Colors.grey),
                              SizedBox(width: 6),
                              Text('45K Lectures', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(String label, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) {},
        selectedColor: Colors.amber,
        labelStyle: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.black : Colors.grey[700],
        ),
      ),
    );
  }
}
