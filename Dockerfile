FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 FEQH_HOST=0.0.0.0 FEQH_TRUST_PROXY=1
COPY --chown=node:node server.mjs index.html app.js styles.css ./
COPY --chown=node:node data/review-data.json ./data/review-data.json
USER node
EXPOSE 3000
CMD ["node","server.mjs"]
