# Aperçu Achetez Easy sur Vercel

Ce dossier est une version **de démonstration** du site, adaptée à Vercel (sans PHP).
Elle sert à montrer le site et à le partager. Ce n’est pas la version de production :
le vrai site reste hébergé sur OVH (dossier `dist/` du projet).

## Mettre l’aperçu en ligne en 2 minutes (glisser-déposer)

1. Aller sur **https://vercel.com/new** (connecté au compte Vercel).
2. En bas, choisir **« Deploy a folder »** (ou installer `vercel` et lancer `vercel`
   dans ce dossier). Déposer **le contenu de ce dossier**.
3. Framework : **Other**. Laisser les réglages par défaut.
4. **Avant / après le déploiement, ajouter une variable d’environnement :**
   - Nom : `CATALOGUE_SOURCE`
   - Valeur : `https://admin-test.achetezeasy.fr/catalogue-public.php`
   - Puis **redéployer** pour qu’elle soit prise en compte.
5. L’URL d’aperçu (`…vercel.app`) est prête à être partagée.

Sans la variable `CATALOGUE_SOURCE`, les pages s’affichent mais le catalogue
reste vide (le relais ne sait pas où chercher les véhicules).

## Ce qui est spécifique à l’aperçu

- Le **catalogue** est relayé par une petite fonction (`api/vehicules.js`), comme
  le fait le fichier PHP sur OVH. L’adresse du back-office n’est **pas** dans le
  code : elle vient de la variable d’environnement.
- Les **photos des véhicules** et les **portraits de l’équipe** sont affichés à
  travers le domaine d’aperçu depuis le site en ligne.
- Le **logo** est servi par une fonction (`api/img.js`), pour que le dossier ne
  contienne aucun fichier image.
- Les **formulaires** (devis, recherche) fonctionnent mais **n’envoient pas**
  d’e-mail sur l’aperçu : ils confirment seulement la réception. Sur OVH, ce sont
  les scripts `envoi-devis.php` / `envoi-recherche.php` qui envoient réellement.
- Tout l’aperçu est en **noindex** : il ne sera pas référencé par Google (c’est
  voulu, pour ne pas faire doublon avec le vrai site).

Les mêmes protections de sécurité que la version OVH sont appliquées
(politique de contenu stricte, anti-clickjacking, etc.) via `vercel.json`.
