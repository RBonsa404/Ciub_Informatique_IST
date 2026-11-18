package com.clubinfo.ist.carte;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontFormatException;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.RadialGradientPaint;
import java.awt.RenderingHints;
import java.awt.font.TextAttribute;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Map;

/**
 * Dessin de la carte de membre aux couleurs du club (charte : bleu nuit, bleu royal, cyan, ambre ; Poppins et Inter).
 * Format carte bancaire (rapport 85,6 × 54), 1600 × 1010 pixels : nette à l'écran comme à l'impression.
 */
public final class DessinCarte {

    public static final int LARGEUR = 1600;
    public static final int HAUTEUR = 1010;

    private static final Color NUIT = new Color(0x0B1E3F);
    private static final Color NUIT_PROFOND = new Color(0x050A18);
    private static final Color ROYAL = new Color(0x1D4ED8);
    private static final Color CYAN = new Color(0x38BDF8);
    private static final Color AMBRE = new Color(0xFBBF24);
    private static final Color BLANC = Color.WHITE;
    private static final Color GRIS_CLAIR = new Color(0xCBD5E1);
    private static final Color GRIS = new Color(0x94A3B8);

    private static final Font POPPINS_600 = police("poppins-600.ttf");
    private static final Font POPPINS_800 = police("poppins-800.ttf");
    private static final Font INTER_500 = police("inter-500.ttf");
    private static final Font INTER_600 = police("inter-600.ttf");
    private static final Font INTER_700 = police("inter-700.ttf");
    private static final BufferedImage LOGO = image("logo.png");

    private DessinCarte() {
    }

    public static byte[] png(DonneesCarte carte) {
        BufferedImage image = new BufferedImage(LARGEUR, HAUTEUR, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            fond(g);
            entete(g);
            titulaire(g, carte);
            qr(g, carte.lienQr());
            pied(g);
        } finally {
            g.dispose();
        }
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", sortie);
            return sortie.toByteArray();
        } catch (IOException erreur) {
            throw new UncheckedIOException(erreur);
        }
    }

    // ---------------------------------------------------------------- fond

    private static void fond(Graphics2D g) {
        RoundRectangle2D carte = new RoundRectangle2D.Double(0, 0, LARGEUR, HAUTEUR, 72, 72);
        g.setClip(carte);
        g.setPaint(new GradientPaint(0, 0, NUIT, LARGEUR, HAUTEUR, NUIT_PROFOND));
        g.fill(carte);
        // Halos : bleu royal en haut à droite, ambre discret en bas à gauche.
        halo(g, LARGEUR - 220, 120, 760, ROYAL, 0.55f);
        halo(g, 120, HAUTEUR + 60, 620, AMBRE, 0.16f);
        halo(g, LARGEUR * 0.55, HAUTEUR * 0.95, 520, CYAN, 0.10f);
        circuits(g);
        // Liseré ambre en haut.
        g.setPaint(new GradientPaint(0, 0, AMBRE, LARGEUR, 0, new Color(0xFBBF24, true)));
        g.fillRect(0, 0, LARGEUR, 10);
    }

    private static void halo(Graphics2D g, double x, double y, float rayon, Color couleur, float intensite) {
        Color centre = new Color(couleur.getRed(), couleur.getGreen(), couleur.getBlue(), Math.round(255 * intensite));
        Color bord = new Color(couleur.getRed(), couleur.getGreen(), couleur.getBlue(), 0);
        g.setPaint(new RadialGradientPaint((float) x, (float) y, rayon, new float[]{0f, 1f}, new Color[]{centre, bord}));
        g.fill(new Ellipse2D.Double(x - rayon, y - rayon, rayon * 2, rayon * 2));
    }

    /** Pistes de circuit imprimé, rappel du logo, en filigrane. */
    private static void circuits(Graphics2D g) {
        g.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        // Tracés placés dans les zones libres : jamais sous un texte ni sous le QR code.
        double[][][] pistes = {
                {{940, 300}, {1010, 300}, {1060, 250}, {1250, 250}},
                {{990, 420}, {1040, 420}, {1040, 600}, {1080, 640}},
                {{620, 870}, {760, 870}, {810, 830}, {960, 830}},
                {{1180, 860}, {1300, 860}, {1340, 820}, {1520, 820}},
        };
        Color[] couleurs = {CYAN, AMBRE, CYAN, AMBRE};
        for (int i = 0; i < pistes.length; i++) {
            Color c = couleurs[i];
            g.setColor(new Color(c.getRed(), c.getGreen(), c.getBlue(), 70));
            Path2D trace = new Path2D.Double();
            trace.moveTo(pistes[i][0][0], pistes[i][0][1]);
            for (int j = 1; j < pistes[i].length; j++) {
                trace.lineTo(pistes[i][j][0], pistes[i][j][1]);
            }
            g.draw(trace);
            double[] fin = pistes[i][pistes[i].length - 1];
            g.fill(new Ellipse2D.Double(fin[0] - 7, fin[1] - 7, 14, 14));
            double[] debut = pistes[i][0];
            g.draw(new Ellipse2D.Double(debut[0] - 6, debut[1] - 6, 12, 12));
        }
    }

    // ---------------------------------------------------------------- en-tête

    private static void entete(Graphics2D g) {
        int x = 80;
        int y = 80;
        int tuile = 168;
        g.setColor(BLANC);
        g.fill(new RoundRectangle2D.Double(x, y, tuile, tuile, 36, 36));
        g.drawImage(LOGO, x + 10, y + 10, tuile - 20, tuile - 20, null);

        int texteX = x + tuile + 36;
        g.setFont(POPPINS_800.deriveFont(50f));
        g.setColor(BLANC);
        g.drawString("Club Informatique", texteX, y + 66);
        int largeurDe = g.getFontMetrics().stringWidth("de l’");
        g.drawString("de l’", texteX, y + 126);
        g.setColor(AMBRE);
        g.drawString("IST", texteX + largeurDe, y + 126);
        g.setFont(INTER_500.deriveFont(25f));
        g.setColor(GRIS);
        g.drawString("Institut Supérieur de Technologies · Ouagadougou", texteX, y + 166);

        // Mention « Carte de membre », en capitales espacées, dans une pastille ambre.
        Font mention = espacee(INTER_700.deriveFont(22f), 0.18f);
        g.setFont(mention);
        String libelle = "CARTE DE MEMBRE";
        int largeur = g.getFontMetrics().stringWidth(libelle);
        int px = LARGEUR - 80 - largeur - 56;
        int py = 96;
        g.setColor(new Color(0xFB, 0xBF, 0x24, 40));
        g.fill(new RoundRectangle2D.Double(px, py, largeur + 56, 58, 58, 58));
        g.setColor(AMBRE);
        g.setStroke(new BasicStroke(2f));
        g.draw(new RoundRectangle2D.Double(px, py, largeur + 56, 58, 58, 58));
        g.drawString(libelle, px + 28, py + 37);
    }

    // ---------------------------------------------------------------- titulaire

    private static void titulaire(Graphics2D g, DonneesCarte carte) {
        int x = 80;
        int largeurMax = 860;

        etiquette(g, "MEMBRE", x, 396);
        g.setColor(BLANC);
        g.setFont(ajuster(g, POPPINS_600, 56f, carte.prenom(), largeurMax));
        g.drawString(carte.prenom(), x, 466);
        String nom = carte.nom().toUpperCase(java.util.Locale.ROOT);
        g.setFont(ajuster(g, POPPINS_800, 84f, nom, largeurMax));
        g.drawString(nom, x, 558);

        etiquette(g, "FILIÈRE", x, 640);
        g.setColor(GRIS_CLAIR);
        String filiere = carte.filiere() == null || carte.filiere().isBlank() ? "Non renseignée" : carte.filiere();
        g.setFont(ajuster(g, INTER_500, 32f, filiere, largeurMax));
        g.drawString(filiere, x, 684);

        etiquette(g, "N° DE MEMBRE", x, 772);
        g.setColor(AMBRE);
        g.setFont(espacee(INTER_700.deriveFont(36f), 0.06f));
        g.drawString(carte.numeroMembre(), x, 818);

        int x2 = x + 470;
        etiquette(g, "MEMBRE DEPUIS", x2, 772);
        g.setColor(BLANC);
        g.setFont(INTER_600.deriveFont(36f));
        g.drawString(carte.membreDepuis(), x2, 818);
    }

    private static void etiquette(Graphics2D g, String texte, int x, int y) {
        g.setColor(CYAN);
        g.setFont(espacee(INTER_700.deriveFont(19f), 0.2f));
        g.drawString(texte, x, y);
    }

    // ---------------------------------------------------------------- QR code

    private static void qr(Graphics2D g, String contenu) {
        int tuile = 400;
        int x = LARGEUR - 80 - tuile;
        int y = 330;
        // Ombre portée légère, puis tuile blanche.
        g.setColor(new Color(0, 0, 0, 90));
        g.fill(new RoundRectangle2D.Double(x + 6, y + 12, tuile, tuile, 44, 44));
        g.setColor(BLANC);
        g.fill(new RoundRectangle2D.Double(x, y, tuile, tuile, 44, 44));

        BitMatrix matrice = matrice(contenu);
        int marge = 34;
        double module = (double) (tuile - 2 * marge) / matrice.getWidth();
        g.setColor(NUIT);
        for (int i = 0; i < matrice.getWidth(); i++) {
            for (int j = 0; j < matrice.getHeight(); j++) {
                if (matrice.get(i, j)) {
                    g.fill(new java.awt.geom.Rectangle2D.Double(x + marge + i * module, y + marge + j * module, module + 0.6, module + 0.6));
                }
            }
        }

        g.setFont(INTER_500.deriveFont(23f));
        g.setColor(GRIS);
        String legende = "À présenter à chaque séance";
        int largeur = g.getFontMetrics().stringWidth(legende);
        g.drawString(legende, x + (tuile - largeur) / 2, y + tuile + 52);
    }

    private static BitMatrix matrice(String contenu) {
        try {
            return new QRCodeWriter().encode(contenu, BarcodeFormat.QR_CODE, 0, 0,
                    Map.of(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.Q, EncodeHintType.MARGIN, 0, EncodeHintType.CHARACTER_SET, "UTF-8"));
        } catch (WriterException erreur) {
            throw new IllegalStateException("QR code impossible à produire", erreur);
        }
    }

    // ---------------------------------------------------------------- pied

    private static void pied(Graphics2D g) {
        int y = HAUTEUR - 92;
        g.setPaint(new GradientPaint(80, 0, CYAN, LARGEUR - 80, 0, new Color(0x38BDF8, true)));
        g.fillRect(80, y, LARGEUR - 160, 3);
        g.setComposite(AlphaComposite.SrcOver);
        g.setFont(INTER_600.deriveFont(25f));
        g.setColor(CYAN);
        g.drawString("informatique.ist-club.bf", 80, y + 52);
        g.setFont(INTER_500.deriveFont(23f));
        g.setColor(GRIS);
        String devise = "IST pour l’excellence";
        int largeur = g.getFontMetrics().stringWidth(devise);
        g.drawString(devise, LARGEUR - 80 - largeur, y + 52);
    }

    // ---------------------------------------------------------------- outils

    /** Police réduite jusqu'à ce que le texte tienne dans la largeur donnée. */
    private static Font ajuster(Graphics2D g, Font base, float taille, String texte, int largeurMax) {
        Font police = base.deriveFont(taille);
        while (taille > 20f && g.getFontMetrics(police).stringWidth(texte) > largeurMax) {
            taille -= 2f;
            police = base.deriveFont(taille);
        }
        return police;
    }

    private static Font espacee(Font police, float espacement) {
        return police.deriveFont(Map.of(TextAttribute.TRACKING, espacement));
    }

    private static Font police(String fichier) {
        try (InputStream flux = DessinCarte.class.getResourceAsStream("/carte/" + fichier)) {
            if (flux == null) {
                throw new IllegalStateException("Police absente : " + fichier);
            }
            return Font.createFont(Font.TRUETYPE_FONT, flux);
        } catch (IOException | FontFormatException erreur) {
            throw new IllegalStateException("Police illisible : " + fichier, erreur);
        }
    }

    private static BufferedImage image(String fichier) {
        try (InputStream flux = DessinCarte.class.getResourceAsStream("/carte/" + fichier)) {
            if (flux == null) {
                throw new IllegalStateException("Image absente : " + fichier);
            }
            return ImageIO.read(flux);
        } catch (IOException erreur) {
            throw new UncheckedIOException(erreur);
        }
    }
}
