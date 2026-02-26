No Rights Included.

# Images
All standard card images come from https://drive.google.com/drive/folders/17IrJkRGmIU9fDSTU2JQEU9JlFzb5liLJ
This repository is created because https://api.sorcerytcg.com/ recommends hosting the data elsewhere.

Images are downloaded seperately from this repository, and then uses the `scripts/compressQuality` script to convert to webp at various compression levels.

# Tokens
Token images and data is not available from the sorcery api. 

These token images are custom added, seperate from the google docs

The pathnames for these tokens are in `public/token.json`. 

To add tokens, add to `public/tokens` and then run `cd scripts && node makeTokenNames.js`.
Generate the images with `cd scripts && ./compressAddTokens.sh`



