#/bin/bash

echo "
--------------------------------------------
-          Starting Cloud-Adapter          -
--------------------------------------------
"

node aws.js &
node azure.js &

read null

read -n1 -r -p "
--------------------------------------------
-  Press any key to cancel all connectors  -
--------------------------------------------
" key

pkill -SIGTERM -f node

echo "
--------------------------------------------
-           Node Servers killed            -
--------------------------------------------
"
