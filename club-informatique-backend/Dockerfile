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

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the built JAR using wildcard (avoids SNAPSHOT naming issues)
COPY --from=builder /app/target/club-informatique-backend-*.jar app.jar

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

# Expose default port (Railway injects $PORT at runtime)
EXPOSE 8080

# JVM tuning for containerized environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Entrypoint: Railway injects PORT and SPRING_PROFILES_ACTIVE env vars
ENTRYPOINT ["sh", "-c", \
  "exec java $JAVA_OPTS \
   -Dserver.port=${PORT:-8080} \
   -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} \
   -jar app.jar"]

