#!/bin/bash
# Script pour corriger automatiquement admin.html

echo "🔧 Correction automatique de admin.html..."

# Vérifier que le fichier existe
if [ ! -f "public/admin.html" ]; then
    echo "❌ Fichier public/admin.html non trouvé !"
    exit 1
fi

# Faire une sauvegarde
cp public/admin.html public/admin.html.backup
echo "💾 Backup créé: public/admin.html.backup"

# Correction 1: get-banner
sed -i 's|`${API_BASE}/api/banner/current`|`${API_BASE}/get-banner`|g' public/admin.html
echo "✅ Corrigé: /api/banner/current → /get-banner"

# Correction 2: create-banner
sed -i 's|`${API_BASE}/api/admin/banner`|`${API_BASE}/create-banner`|g' public/admin.html
echo "✅ Corrigé: /api/admin/banner → /create-banner"

# Correction 3: delete-banner
sed -i 's|`${API_BASE}/api/admin/banner/current`|`${API_BASE}/delete-banner`|g' public/admin.html
echo "✅ Corrigé: /api/admin/banner/current → /delete-banner"

# Correction 4: reopen-banner
sed -i 's|`${API_BASE}/api/admin/banner/reopen`|`${API_BASE}/reopen-banner`|g' public/admin.html
echo "✅ Corrigé: /api/admin/banner/reopen → /reopen-banner"

echo ""
echo "🎉 Corrections terminées !"
echo ""
echo "📝 Résumé des changements:"
echo "  - /api/banner/current → /get-banner"
echo "  - /api/admin/banner → /create-banner"
echo "  - /api/admin/banner/current → /delete-banner"
echo "  - /api/admin/banner/reopen → /reopen-banner"
echo ""
echo "💡 Pour annuler: cp public/admin.html.backup public/admin.html"
