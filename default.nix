{ pkgs ? import <nixpkgs> {} }:

pkgs.stdenv.mkDerivation {
  name = "kkkyyy-1.2.0";
  src = ./.;

  nativeBuildInputs = [ pkgs.makeWrapper ];

  installPhase = ''
    mkdir -p $out/share/kkkyyy $out/bin $out/share/applications

    shopt -s extglob
    cp -r !(result) $out/share/kkkyyy/

    makeWrapper ${pkgs.electron}/bin/electron \
      $out/bin/kkkyyy \
      --add-flags $out/share/kkkyyy

    cat > $out/share/applications/kkkyyy.desktop << EOF
[Desktop Entry]
Name=kkkyyy
Comment=Code time tracker visualizer
Exec=$out/bin/kkkyyy
Icon=$out/share/kkkyyy/icon.svg
Type=Application
Categories=Utility;Development;
Terminal=false
EOF
  '';

  meta = {
    description = "Code time tracker visualizer";
    longDescription = "One-click code time tracker with live timer, daily bar chart, and Catppuccin Macchiato theme. Data stored in JSON at ~/.local/share/kkkyyy/code-time.json.";
    homepage = "https://github.com/erenind/kkkyyy";
    license = pkgs.lib.licenses.isc;
    maintainers = [];
    platforms = pkgs.lib.platforms.linux;
    mainProgram = "kkkyyy";
  };
}
