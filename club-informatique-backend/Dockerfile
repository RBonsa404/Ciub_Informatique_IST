# ===================================================================
# Club Informatique IST — Dockerfile Multi-Stage (Build + Run)
# ===================================================================
# Stage 1: Build with Maven + JDK 17
# Stage 2: Minimal JRE runtime image for production

# ── Stage 1: Build ─────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml first to leverage layer caching for dependency downloads
COPY pom.xml ./

# Download dependencies (cached layer if pom.xml unchanged)
RUN mvn dependency:go-offline -B -q

# Copy the full source tree
COPY src ./src

# Build the fat JAR (skip tests — Railway CI can run them separately)
RUN mvn clean package -DskipTests -B

# ── Stage 2: Runtime ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Rendu du texte de la carte de membre (Java2D) : bibliothèques de polices du système.
RUN apk add --no-cache fontconfig freetype ttf-dejavu

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the built JAR using wildcard (avoids SNAPSHOT naming issues)
COPY --from=builder /app/target/club-informatique-backend-*.jar app.jar

# Démarrage accéléré (CDS) : l'application est extraite, puis lancée une fois pour enregistrer les classes chargées
# dans une archive que chaque démarrage réel relit au lieu de tout recharger. L'entraînement s'arrête dès le contexte
# prêt, sans base de données (migrations et lecture du schéma désactivées). S'il échouait, l'archive serait simplement
# absente et l'application démarrerait normalement.
RUN java -Djarmode=tools -jar app.jar extract --destination application && rm app.jar
RUN cd application && export JWT_SECRET="$(od -An -N48 -tx1 /dev/urandom | tr -dc '0-9a-f')" && \
    (java -XX:ArchiveClassesAtExit=application.jsa -XX:TieredStopAtLevel=1 -Djava.awt.headless=true \
         -Dspring.context.exit=onRefresh -Dspring.profiles.active=prod \
         -Dspring.flyway.enabled=false -Dspring.jpa.hibernate.ddl-auto=none \
         -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false \
         -Dspring.datasource.url=jdbc:postgresql://127.0.0.1:1/entrainement \
         -jar app.jar > /tmp/entrainement-cds.log 2>&1 || true) && \
    (ls -la application.jsa 2>/dev/null || (echo "Archive CDS absente" && tail -20 /tmp/entrainement-cds.log))

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

# Expose default port (Railway injects $PORT at runtime)
EXPOSE 8080

# Réglages pour un petit conteneur : mémoire bornée par celle du conteneur, ramasse-miettes série (un seul processeur),
# piles réduites, arrêt franc en cas de mémoire épuisée. Compilation à un seul niveau (C1) : sur une fraction de
# processeur, le compilateur optimisant ralentit surtout le démarrage, qui conditionne le réveil après une mise en veille.
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError -XX:TieredStopAtLevel=1 -Djava.security.egd=file:/dev/./urandom -Djava.awt.headless=true"

# Entrypoint: Railway injects PORT and SPRING_PROFILES_ACTIVE env vars
ENTRYPOINT ["sh", "-c", \
  "exec java $JAVA_OPTS \
   -Dserver.port=${PORT:-8080} \
   -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} \
   -XX:SharedArchiveFile=/app/application/application.jsa -Xlog:cds=off -Xlog:cds+dynamic=off    -jar /app/application/app.jar"]

