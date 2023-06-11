#!/bin/bash -eu
# Match the node_modules dependencies in this project with those in the target project
# and where possible create a symlink from our dependency to the one in the target
# project so that when OUR modules are linked into the TARGET project, it still uses
# its own dependencies
# Fixes https://stackoverflow.com/questions/65922344/how-to-fix-react-invalid-hook-call-error-when-importing-npm-linked-component

target="${1:-}"

if [ -z "$target" ]; then
    echo "usage: $0 <dest package>" >&2
    exit 1
fi

if [ ! -d "$target" ]; then
    echo "$target is not a directory" >&2
    exit 1
fi

# Convert target to be absolute
target=$(cd "$target" && pwd)

if [ ! -d "$target/node_modules" ]; then
    echo "node_modules not found in $target" >&2
    exit 1
fi

dirs=$(find . -name node_modules -type d -prune)

for dir in $dirs ; do
    echo "Matching deps in $dir"

    for module in "$dir"/* ; do
        module="$(basename "$module")"
        
        # All modules are symlinks as we're using .pnpm
        if [ -L "$dir/$module" ]; then
            linktarget="$(readlink "$dir/$module")"
            if [[ "$linktarget" == ../../* ]] && [[ "$linktarget" != */node_modules/* ]]; then
                echo "skipping internal dependency $dir/$module"
            elif [ -e "$target"/node_modules/"$module" ]; then
                echo "$dir/$module"
                rm "$dir/$module"
                ln -s "$target"/node_modules/"$module" "$dir/$module"
            fi
        fi

        # A module namespace folder
        if [ -d "$dir/$module" ]; then
            for innermodule in "$dir/$module"/* ; do
                innermodule="$(basename "$innermodule")"

                # All modules are symlinks as we're using .pnpm
                if [ -L "$dir/$module/$innermodule" ]; then
                    linktarget="$(readlink "$dir/$module/$innermodule")"
                    if [[ "$linktarget" == ../../* ]] && [[ "$linktarget" != */node_modules/* ]]; then
                        echo "skipping internal dependency $dir/$module/$innermodule"
                    elif [ -e "$target"/node_modules/"$module/$innermodule" ]; then
                        echo "$dir/$module/$innermodule"
                        rm "$dir/$module/$innermodule"
                        ln -s "$target"/node_modules/"$module/$innermodule" "$dir/$module/$innermodule"
                    fi
                fi
            done
        fi
    done
done
