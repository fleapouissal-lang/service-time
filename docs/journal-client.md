# Service Time — Documentation de livraison

**Produit :** plateforme web de maintenance automobile et pièces détachées  
**Site production :** https://servicetime.com.sa  
**Langues :** arabe (prioritaire, RTL) + anglais  
**Document destiné au client** — guide des rôles et des parcours

---

## 1. Vue d’ensemble

Service Time connecte trois types d’utilisateurs autour d’un même flux :

1. le **client** demande un service ou commande des pièces ;
2. l’**administrateur** organise, assigne et gère le catalogue ;
3. le **technicien** (mobile ou atelier) exécute l’intervention.

| Rôle | Accès principal | Création du compte |
|------|-----------------|-------------------|
| **Administrateur** | `/admin` | Créé par un admin |
| **Technicien** (mobile ou atelier) | `/technician` | Créé par un admin |
| **Client** | `/client` | Inscription publique ou créé par un admin |

> Il n’y a **pas** de 4ᵉ rôle séparé « atelier » : l’atelier est un **type de technicien**.

---

## 2. Visiteur (sans compte)

Avant connexion, toute personne peut :

- consulter l’accueil, les services, les emplacements, à propos, contact ;
- parcourir le catalogue de pièces détachées ;
- démarrer une **demande rapide** (sans compte) ;
- contacter via WhatsApp / formulaire ;
- s’inscrire ou se connecter.

**Ne peut pas :** accéder aux tableaux de bord, suivre une commande privée, finaliser un checkout pièces sans compte client.

---

## 3. Rôle Client (`client` / عميل)

### Objectif
Commander un service d’entretien, acheter des pièces, suivre l’intervention et gérer son compte / ses véhicules.

### Comment obtenir un compte
- **Inscription** sur `/register` (e-mail + téléphone + mot de passe) → code de vérification → activation → connexion ;
- **Demande rapide** : un compte client peut être créé automatiquement, avec envoi des accès ;
- **Création par l’admin** depuis la gestion des utilisateurs.

### Connexion
Page `/login` — e-mail **ou** numéro de téléphone + mot de passe.  
Après connexion → tableau de bord `/client`.

### Écrans principaux

| Écran | Route | Utilité |
|-------|-------|---------|
| Vue d’ensemble | `/client` | Résumé + dernier suivi |
| Mes demandes | `/client/orders` | Historique des services |
| Demandes pièces | `/client/spare-part-orders` | Suivi des commandes pièces |
| Mes véhicules | `/client/vehicles` | Ajouter / gérer les voitures |
| Nouvelle demande | `/client/request` ou `/request` | Demande de service complète |
| Suivi | `/client/track` | Suivi en direct de l’intervention |
| Paiement | `/client/requests/pay/...` | Paiement du service |
| Paramètres / profil | `/client/settings` | Compte, contact, mot de passe |

### Ce que le client peut faire
- Créer une **demande de service** (atelier ou technicien mobile) avec véhicule, localisation, description, photos ;
- Proposer un prix / accepter une contre-proposition de l’admin ;
- Choisir le mode de paiement (à la livraison ou en ligne, selon configuration) ;
- **Suivre** sa demande (statuts + carte du technicien quand il est en route / arrivé) ;
- Commander des **pièces** (panier → checkout) et suivre la commande ;
- Gérer ses **véhicules** ;
- Modifier son profil (nom, téléphone, e-mail, mot de passe, photo).

### Ce que le client ne peut pas faire
- Accéder à l’espace admin ou technicien ;
- Assigner un technicien ;
- Modifier le catalogue services / pièces ;
- Voir les commandes des autres clients.

---

## 4. Rôle Administrateur (`admin` / مدير)

### Objectif
Piloter toute la plateforme : demandes, utilisateurs, catalogue, emplacements, rapports.

### Comment obtenir un compte
Uniquement créé (ou promu) par un administrateur existant — **pas** via l’inscription publique.

### Connexion
`/login` → redirection vers `/admin`.

### Écrans principaux

| Écran | Route | Utilité |
|-------|-------|---------|
| Tableau de bord | `/admin` | Indicateurs et vue globale |
| Demandes de service | `/admin/orders` | Toutes les demandes |
| Services | `/admin/services` | Catalogue + prix sous-services |
| Pièces détachées | `/admin/spare-parts` | Catalogue pièces |
| Commandes pièces | `/admin/spare-part-orders` | Gestion des commandes |
| Emplacements | `/admin/locations` | Ateliers affichés sur le site |
| Utilisateurs | `/admin/users` | Créer / modifier comptes |
| Rapports | `/admin/reports` | Statistiques |
| Paramètres | `/admin/settings` | Compte admin |

### Ce que l’admin peut faire
- Voir et gérer **toutes** les demandes de service ;
- Créer une demande pour un client ;
- **Assigner** un technicien (mobile ou atelier) ;
- Gérer priorités, statuts, devis (accepter / contre-proposer) ;
- Suivre / gérer les paiements côté admin ;
- CRUD du **catalogue services** et **pièces** ;
- Gérer les **commandes de pièces** ;
- Gérer les **emplacements** (carte / page lieux) ;
- Créer des comptes **admin**, **technicien** ou **client** ;
- Activer / désactiver / supprimer des utilisateurs ;
- Consulter les **rapports**.

### Ce que l’admin ne peut pas faire
- Utiliser le parcours client (checkout pièces, demande « comme un client ») ;
- Se créer via `/register` (réservé aux clients).

---

## 5. Rôle Technicien (`technician` / فني)

### Objectif
Exécuter les interventions **qui lui sont assignées** et mettre à jour le statut / la position.

### Deux types (même espace, rôles métier différents)

| Type | Code | Description |
|------|------|-------------|
| **Technicien mobile** | `mobile` | Intervention sur site / chez le client |
| **Atelier (ورشة)** | `workshop` | Intervention en atelier |

Les deux utilisent le même tableau de bord `/technician`. Le type sert surtout à l’organisation et à l’affichage côté admin.

### Comment obtenir un compte
Créé uniquement par l’**administrateur** (e-mail, mot de passe, type mobile ou atelier).

### Connexion
`/login` → redirection vers `/technician`.

### Écrans principaux

| Écran | Route | Utilité |
|-------|-------|---------|
| Vue d’ensemble | `/technician` | Indicateurs sur ses missions |
| Mes commandes | `/technician/orders` | Liste et détail des interventions |
| Localisation | `/technician/location` | Partage GPS (suivi client) |
| Paramètres | `/technician/settings` | Profil et sécurité |

### Ce que le technicien peut faire
- Voir **uniquement** les demandes qui lui sont assignées ;
- Mettre à jour le **statut** de l’intervention, par exemple :  
  reçue → assignée → en cours → en route → arrivé → terminée (ou annulée) ;
- Consulter les détails / photos de la demande ;
- Publier sa **position GPS** (utile pour le suivi client « en route / arrivé ») ;
- Gérer son profil.

### Ce que le technicien ne peut pas faire
- Voir les demandes non assignées ;
- Créer ou gérer des utilisateurs ;
- Modifier le catalogue services / pièces ;
- Négocier le devis ou assigner un autre technicien ;
- Accéder à `/admin` ou `/client`.

---

## 6. Parcours métier (résumé)

### Demande de service
```
Client (ou demande rapide)
    → Admin reçoit / crée / assigne un technicien
    → Négociation de prix si besoin
    → Technicien exécute + met à jour statut / GPS
    → Client suit en direct + paie selon le mode choisi
```

### Commande de pièces
```
Visiteur / Client parcourt /spare-parts
    → Client connecté valide le checkout
    → Admin gère la commande pièces
    → Client suit dans /client/spare-part-orders
```

### Statuts typiques d’une intervention
| Statut (idée) | Signification |
|---------------|---------------|
| Reçue | Demande enregistrée |
| Assignée | Technicien désigné |
| En cours | Traitement démarré |
| En route | Technicien mobile en déplacement |
| Arrivé | Sur place |
| Terminée | Intervention finie |
| Annulée | Annulation |

---

## 7. Accès & sécurité (points clés)

- Chaque espace (`/admin`, `/technician`, `/client`) est **protégé** : un mauvais rôle est redirigé.
- Un compte **désactivé** ne peut plus se connecter.
- Les clients ne voient **que** leurs propres données (règles de sécurité base de données).
- Les techniciens ne voient **que** les missions assignées.
- L’admin a une vision globale.

---

## 8. Contacts plateforme (production)

| Canal | Valeur |
|-------|--------|
| Site | https://servicetime.com.sa |
| E-mail | servicetime10@gmail.com |
| Téléphone / WhatsApp | +966 58 381 4214 |

---

## 9. Comptes de démonstration (environnement de test)

> À utiliser uniquement sur un environnement de test / seed — **à changer en production**.

| E-mail | Mot de passe | Rôle |
|--------|--------------|------|
| `admin@servicetime.sa` | `Admin123!` | Administrateur |
| `tech@servicetime.sa` | `Tech123!` | Technicien mobile |
| `workshop@servicetime.sa` | `Tech123!` | Technicien atelier |
| `client@servicetime.sa` | `Client123!` | Client |
| `sara@servicetime.sa` | `Client123!` | Client |

---

## 10. Livrables inclus

- Site web public (accueil, services, pièces, contact, emplacements, pages légales)
- Espaces **Client**, **Technicien**, **Admin**
- Demande de service (rapide + complète) + suivi
- Catalogue pièces + panier / commande
- Gestion utilisateurs, services, pièces, emplacements, rapports
- E-mails transactionnels (SMTP Gmail configuré)
- Mise en ligne HTTPS sur le domaine client

---

*Document de livraison Service Time — rôles et responsabilités.*  
*Version : juillet 2026*
