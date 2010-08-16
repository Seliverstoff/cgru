#!/bin/bash

# Setup CGRU and Afanasy:
pushd .. >> /dev/null
source ./setup.sh
popd >> /dev/null

# Setup CGRU common scripts if location provided
if [ ! -z "${CGRU_LOCATION}" ]; then
   export NUKE_CGRU_PATH="${CGRU_LOCATION}/plugins/nuke"
   if [ -z "${NUKE_PATH}" ]; then
      export NUKE_PATH="${NUKE_CGRU_PATH}"
   else
      export NUKE_PATH="${NUKE_PATH}:${NUKE_CGRU_PATH}"
   fi
   pushd "${CGRU_LOCATION}"
   source setup.sh
   popd
fi

# Set Afanasy scripts version to use
export NUKE_AF_VERSION="python"
# Set Afanasy scripts location to use
export NUKE_AF_PATH=$AF_ROOT/plugins/nuke/$NUKE_AF_VERSION
# Add Afanasy scripts to Nuke path
if [ -z "${NUKE_PATH}" ]; then
   export NUKE_PATH="${NUKE_AF_PATH}"
else
   export NUKE_PATH="${NUKE_PATH}:${NUKE_AF_PATH}"
fi

# Default number of threads for rendering:
export NUKE_AF_RENDERTHREADS=2

# Nuke render launcher:
export NUKE_AF_RENDER="nuke -i -m AF_THREADS"
if [ ! -z "${CGRU_LOCATION}" ]; then
   export NUKE_AF_RENDER="${NUKE_AF_RENDER} -t ${CGRU_LOCATION}/plugins/nuke/render.py"
fi

# Path to save 'Untitled' scene to render, if not set 'tmp' name in current folder will be used
# export NUKE_AF_TMPSCENE="compositing/tmp"

NUKE_INSTALL_DIR="/usr/local"
NUKE_FOLDERS=`ls "$NUKE_INSTALL_DIR"`
NUKE_LOCATION=""
NUKE_EXEC=""
for NUKE_FOLDER in $NUKE_FOLDERS ;
do
   if [ "`echo $NUKE_FOLDER | gawk '{print match( \$1, "Nuke")}'`" == "1" ]; then
      NUKE_LOCATION="${NUKE_INSTALL_DIR}/${NUKE_FOLDER}"
      NUKE_EXEC="`echo $NUKE_FOLDER | gawk '{print substr( \$1, 1, -1+match( \$1, "v.*"))}'`"
   fi
done
export NUKE_EXEC="${NUKE_LOCATION}/${NUKE_EXEC}"
echo "NUKE = '${NUKE_EXEC}'"

# overrides (set custom values there):
[ -f override.sh ] && source override.sh