# ☁️ STRATÉGIE DE DÉPLOIEMENT CLOUD DE PRODUCTION (AWS)

Ce répertoire contient le livrable d'architecture de référence servant au déploiement de la plateforme unifiée **Stilova** sur l'infrastructure cloud **Amazon Web Services (AWS)**.

---

## 🗺️ TOPOLOGIE DE L'ARCHITECTURE CLOUD

```text
                  [ ROUTE 53 DNS & ACM SSL ]
                              │
                              ▼
                  [ CLOUDFRONT CONTENT CDN ]
                              │
                    (Service d'Imagerie S3)
                              ▼
               [ APPLICATION LOAD BALANCER (ALB) ]
                              │
         ┌────────────────────┴────────────────────┐
         ▼ (Zone Dispo-A Private)                  ▼ (Zone Dispo-B Private)
  [ ECS FARGATE TASK ]                      [ ECS FARGATE TASK ]
   (NestJS Container)                        (NestJS Container)
         │                                         │
         ├───> [ ELASTICACHE REDIS CLUSTER ] <─────┤
         │        (Mise en Cache / Queue)          │
         │                                         │
         └───> [ RDS POSTGRESQL PRIMARY ] <────────┘
                    (Base Active)
                         │ (Réplication Synchrone)
                         ▼
               [ RDS POSTGRESQL STANDBY ]
                    (Base Passive)
```

---

## 🔒 DIRECTIVES DE MISE EN SÉCURITÉ DE L'INFRASTRUCTURE

1.  **VPC Multi-AZ (Réseau Isolé)** :
    *   Hébergement des instances de calcul ECS Fargate, des nœuds de cache Redis et de l'instance PostgreSQL exclusivement dans des **sous-réseaux privés**.
    *   Aucune IP publique n'est allouée à nos tâches de conteneur. Seul l'équilibreur de charge applicatif (ALB), positionné dans les sous-réseau publics, est accessible depuis l'internet extérieur via HTTPS. Allouez des passerelles NAT Gateways pour permettre aux conteneurs de joindre les APIs externes (comme le SDK Google Gemini).
2.  **AWS Key Management Service (KMS) & Secrets Manager** :
    *   Toutes les clés d'APIs privées (dont la clé maîtresse `GEMINI_API_KEY`) et les identifiants d'accès de bases de données sont injectés de manière chiffrée à la volée depuis **AWS Secrets Manager**.
    *   Chiffrement au repos de l'intégralité du stockage du bucket S3 (contenant les couvertures littéraires et les avatars) et des volumes RDS via une clé d'enveloppe symétrique **AWS KMS**.
3.  **Politique IAM Moindre Privilège** :
    *   Rôle d'exécution des tâches ECS (`TaskExecutionRole`) restreint à la récupération des secrets d'APIs et à l'écriture de logs vers CloudWatch.
    *   Rôle applicatif (`TaskRole`) restreint à l'écriture et à la lecture vers le bucket d'illustrations Stilova S3.

---

## 📈 RÈGLES DE CONDUITE ET AUTOSCALING (ECS FARGATE)

La mise à l'échelle automatique de nos serveurs NestJS est orchestrée à l'aide de politiques associées aux alarmes **AWS CloudWatch** :

*   **Taille minimale d'exécution** : 2 tâches de conteneur.
*   **Taille maximale d'exécution** : 10 tâches de conteneur.
*   **Seuil Critique CPU (Scale-Out)** : Si la consommation CPU globale dépasse **70%** pendant plus de 2 minutes successives, une nouvelle tâche Fargate est démarrée.
*   **Seuil Critique Mémoire (Scale-Out)** : Si l'utilisation de la mémoire RAM dépasse **75%**, Fargate instancie immédiatement un nouveau nœud de calcul.
*   **Refroidissement (Cooldown)** : Un délai de 60 secondes est observé après chaque événement d'échelle pour éviter l'effet d'oscillation (thrashing).
