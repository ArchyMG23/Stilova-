import 'package:flutter/material.dart';

class ReadingPanel extends StatefulWidget {
  final String storyId;
  const ReadingPanel({super.key, required this.storyId});

  @override
  State<ReadingPanel> createState() => _ReadingPanelState();
}

class _ReadingPanelState extends State<ReadingPanel> {
  double _fontSize = 16.0;
  bool _useSerif = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Dakar 2146 : Chapitre 1',
          style: TextStyle(fontFamily: 'Playfair Display', fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.format_size),
            onPressed: () {
              setState(() {
                _fontSize = _fontSize == 16.0 ? 20.0 : 16.0;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.font_download_outlined),
            onPressed: () {
              setState(() {
                _useSerif = !_useSerif;
              });
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // SCROLLABLE BOOK READING SPACE
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Les Tambours de Néon',
                      style: TextStyle(
                        fontFamily: 'Playfair Display',
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Par Yasmine Diagne',
                      style: TextStyle(
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey,
                      ),
                    ),
                    const Divider(height: 30),
                    Text(
                      'Le vent chaud du Sahel s’engouffrait à travers les mailles de graphène de la tour Walo. En bas, à perte de vue, les toits de Dakar scintillaient d’une lueur d’or liquide, alimentés par les panneaux solaires à haut rendement organique. \n\n'
                      'Ousmane ajusta son monocle cybernétique. Les flux de données coulaient devant sa rétine comme les eaux tumultueuses du fleuve Niger après la mousson. Les rumeurs de la cour royale étaient fondées... \n\n'
                      'L’un des processeurs mémoriels du Griot central de l\'État s’était volatilisé. Quelqu’un cherchait à réécrire la grande charte numérique.',
                      style: TextStyle(
                        fontFamily: _useSerif ? 'Georgia' : 'Inter',
                        fontSize: _fontSize,
                        height: 1.8,
                      ),
                    ),
                    const SizedBox(height: 30),

                    // CHOICE OF ADVENTURE PORTAL (Interactive pathways)
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.08),
                        border: Border.all(color: Colors.amber.withOpacity(0.35)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.stars, color: Colors.amber, size: 20),
                              SizedBox(width: 8),
                              Text(
                                "Quel sera ton choix, Griot ?",
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          _buildChoiceButton(
                            'S\'infiltrer sous couverture dans les ruines de l\'ancienne académie',
                            () {},
                          ),
                          const SizedBox(height: 10),
                          _buildChoiceButton(
                            'Convoquer l\'assemblée de la Grande Charte sous le Baobab Sacré',
                            () {},
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            // IMMERSIVE PROGRESS TRACKER
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Colors.black12)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Page 4 sur 280', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  Row(
                    children: [
                      const Icon(Icons.bookmark_outline, size: 18, color: Colors.grey),
                      const SizedBox(width: 15),
                      TextButton(
                        onPressed: () {},
                        child: const Text('Prendre une Note', style: TextStyle(fontSize: 12)),
                      )
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildChoiceButton(String label, VoidCallback onPressed) {
    return Container(
      width: double.infinity,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Colors.amber),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        ),
        onPressed: onPressed,
        child: Align(
          alignment: Alignment.centerLeft,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.amber,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
