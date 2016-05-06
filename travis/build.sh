#!/usr/bin/env bash

# making sure java-8 is installed
java -version

git config --global user.email "jayaram.kancherla@gmail.com"
git config --global user.name "Jayaram (travis)"

# generate min files
java -jar -Done-jar.silent=true travis/minifier.jar ./index.php travis/epiMin
mv travis/epiMin/min.js travis/epiMin/epiviz-min.js
mv travis/epiMin/min.css travis/epiMin/epiviz-min.css

# clone min branch
git clone https://github.com/epiviz/epiviz.git travis/output
cd travis/output
git checkout -t origin/min

# copy min files to the min branch
cp ../epiMin/epiviz-min.js .
cp ../epiMin/epiviz-min.css .
cp -r ../epiMin/css-img .
cp -r ../epiMin/images .

git add .
git commit -m "Travis CI auto-build branch:min"

git push "https://${GH_TOKEN}@github.com/epiviz/epiviz.git" min