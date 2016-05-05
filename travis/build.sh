#!/usr/bin/env bash

#generate min files
java -jar -Done-jar.silent=true ./minifier.jar ../index.php ./epiMin
mv ./epiMin/min.js ./epiMin/epiviz-min.js
mv ./epiMin/min.css ./epiMin/epiviz-min.css

#clone min branch
git clone https://github.com/jkanche/epiviz.git ./output
cd ./output
github checkout -t origin/min

cp ../epiMin/epiviz-min.js src/epiviz
cp ../epiMin/epiviz-min.css src/epiviz
cp -r ../epiMin/css-img .
cp -r ../epiMin/images .

git add .
git commit -m "auto build Min"

git push origin/min


#cleanup