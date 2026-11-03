// Aperçu Vercel : réception d'une demande de devis en mode démonstration.
// Rien n'est envoyé par e-mail (ce serait le rôle de envoi-devis.php sur le
// serveur OVH). La fonction confirme simplement la bonne réception du flux.
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end(JSON.stringify({ ok: false, message: 'Méthode non autorisée.' }));
  }
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      ok: true,
      message:
        'Aperçu de démonstration : votre demande a bien été reçue par le formulaire, mais aucun e-mail n’est envoyé sur cette version de test. Sur le site en ligne, elle parviendra à l’équipe Achetez Easy.',
    }),
  );
};
