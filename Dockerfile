# ===================================================================
# Club Informatique IST — Root Dockerfile (Railway Monorepo Support)
# ===================================================================
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml from backend directory
COPY club-informatique-backend/pom.xml ./

# Download dependencies
RUN mvn dependency:go-offline -B -q

# Copy source code from backend directory
COPY club-informatique-backend/src ./src

# Build the fat JAR
RUN mvn clean package -DskipTests -B

# ── Stage 2: Runtime ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/target/club-informatique-backend-*.jar app.jar

RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", \
  "exec java $JAVA_OPTS \
   -Dserver.port=${PORT:-8080} \
   -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} \
   -jar app.jar"]
