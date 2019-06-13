#/bin/bash

echo "
--------------------------------------------
-          Starting Cloud-Adapter          -
--------------------------------------------
"

node to-sns.js &
node from-sns.js &
node to-eventgrid.js &
node from-eventgrid.js &

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
