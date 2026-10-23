#!/usr/bin/env python3
"""
NeoScan GitHub Push Utility
Pushes the local git repository to https://github.com/dakshakhare123-hub/Neo-Sight.git
using pure-python Dulwich (no Xcode Command Line Tools required).
"""

import os
import sys
import getpass
import certifi
from dulwich import porcelain
from dulwich.repo import Repo

# Ensure SSL certificates are properly loaded on macOS
os.environ["SSL_CERT_FILE"] = certifi.where()

def push(token: str = None):
    workspace = os.path.dirname(os.path.abspath(__file__))
    repo = Repo(workspace)

    # Set HEAD to refs/heads/main
    repo.refs[b'refs/heads/main'] = repo.head()

    if not token:
        token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")

    if not token:
        print("\nGitHub requires authentication to push to 'dakshakhare123-hub/Neo-Sight'.")
        print("Please create a Personal Access Token (classic with 'repo' scope or fine-grained with 'Contents: Read/Write') at:")
        print("👉 https://github.com/settings/tokens\n")
        try:
            token = getpass.getpass("Enter your GitHub Personal Access Token (hidden): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nAborted.")
            sys.exit(1)

    if not token:
        print("Error: No token provided.")
        sys.exit(1)

    auth_url = f"https://{token}@github.com/dakshakhare123-hub/Neo-Sight.git"

    print(f"Pushing to https://github.com/dakshakhare123-hub/Neo-Sight.git (branch: main)...")
    try:
        porcelain.push(repo, auth_url, refspecs=[b'refs/heads/main:refs/heads/main'])
        print("\n✅ Successfully pushed all code and history to https://github.com/dakshakhare123-hub/Neo-Sight.git (main branch)!")
    except Exception as e:
        print(f"\n❌ Push failed: {type(e).__name__} - {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure your token has 'repo' (Full control of private repositories) permissions.")
        print("2. Ensure the repository exists at: https://github.com/dakshakhare123-hub/Neo-Sight")
        sys.exit(1)

if __name__ == "__main__":
    cli_token = sys.argv[1] if len(sys.argv) > 1 else None
    push(cli_token)
