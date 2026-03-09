#!/bin/bash
# scripts/setup-smb-mount.sh
# Run with: FILESERVER_USER=x FILESERVER_PASS=y npm run mount:smb

set -e

SMB_HOST="192.168.168.199"
SMB_SHARE="DocServer"
MOUNT_POINT="/mnt/docserver"
CREDS_FILE="/etc/smb-credentials"

# ─── Root check ───────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo bash setup-smb-mount.sh"
  exit 1
fi

# ─── Read from env ────────────────────────────────────────────
if [ -z "$FILESERVER_USER" ] || [ -z "$FILESERVER_PASS" ]; then
  echo "❌ FILESERVER_USER and FILESERVER_PASS env vars must be set"
  echo ""
  echo "   Run with:"
  echo "   FILESERVER_USER=myuser FILESERVER_PASS=mypass npm run mount:smb"
  exit 1
fi

echo "✅ Credentials loaded from environment"

FSTAB_ENTRY="//${SMB_HOST}/${SMB_SHARE} ${MOUNT_POINT} cifs credentials=${CREDS_FILE},iocharset=utf8,vers=3.0,_netdev,uid=$(id -u),gid=$(id -g) 0 0"

# ─── Install cifs-utils ───────────────────────────────────────
echo "📦 Installing cifs-utils..."
apt-get update -qq && apt-get install -y cifs-utils
echo "✅ cifs-utils installed"

# ─── Create mount point ───────────────────────────────────────
echo "📁 Creating mount point at ${MOUNT_POINT}..."
mkdir -p "$MOUNT_POINT"
echo "✅ Mount point ready"

# ─── Credentials file ─────────────────────────────────────────
cat > "$CREDS_FILE" <<EOF
username=${FILESERVER_USER}
password=${FILESERVER_PASS}
domain=
EOF

chmod 600 "$CREDS_FILE"
echo "✅ Credentials saved to ${CREDS_FILE} (chmod 600)"

# ─── fstab ───────────────────────────────────────────────────
echo "📝 Adding fstab entry..."
sed -i "\|^//${SMB_HOST}/${SMB_SHARE}|d" /etc/fstab
echo "$FSTAB_ENTRY" >> /etc/fstab
echo "✅ fstab updated"

# ─── Mount now ───────────────────────────────────────────────
echo "🔗 Mounting share..."
mount "$MOUNT_POINT"
echo "✅ Share mounted at ${MOUNT_POINT}"

# ─── Verify ──────────────────────────────────────────────────
echo ""
echo "🧪 Verifying mount..."
if mountpoint -q "$MOUNT_POINT"; then
  echo "✅ ${MOUNT_POINT} is mounted"
  ls "$MOUNT_POINT"
else
  echo "❌ Mount verification failed — check credentials and network"
  exit 1
fi

echo ""
echo "🎉 Done! SMB share is mounted at ${MOUNT_POINT}"
echo "   It will auto-mount on reboot via /etc/fstab"