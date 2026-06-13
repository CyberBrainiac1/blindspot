{
  description = "User interface for blindspot";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_24
            pnpm_11

            typescript
            typescript-language-server
          ];
          shellHook = ''
            export NODE_PATH="${pkgs.typescript}/lib/node_modules:$NODE_PATH"
            export TSDK_PATH="${pkgs.typescript}/lib/node_modules/typescript/lib"
          '';
        };
      }
    );
}
