# ===================================================================
# Club Informatique IST — Dockerfile Multi-Stage (Build + Run)
# ===================================================================
# Stage 1: Build with Maven (includes dependencies download & compile)
# Stage 2: Minimal JRE runtime image for production

# ── Stage 1: Build ─────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /app

# Copy only the pom.xml first (leverage Docker layer caching for dependencies)
COPY pom.xml ./

# Download all dependencies (cached if pom.xml hasn't changed)
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B 2>/dev/null || \
    (apk add --no-cache maven && mvn dependency:go-offline -B)

# Install Maven (alpine doesn't include it by default with jdk image)
RUN apk add --no-cache maven

# Pre-fetch dependencies
RUN mvn dependency:go-offline -B

# Copy the full source tree
COPY src ./src

# Build the fat JAR, skipping tests (Railway runs tests in CI if needed)
RUN mvn clean package -DskipTests -B && \
    ls -la target/

# ── Stage 2: Runtime ───────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the built JAR from the builder stage (use wildcard to avoid SNAPSHOT issues)
COPY --from=builder /app/target/club-informatique-backend-*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

# Expose the server port (Railway injects $PORT at runtime)
EXPOSE 8080

# JVM tuning for containerized environments
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:+OptimizeStringConcat \
               -Djava.security.egd=file:/dev/./urandom"

# Entrypoint: Railway injects PORT env var; we pass it to Spring
ENTRYPOINT ["sh", "-c", \
  "exec java $JAVA_OPTS \
   -Dserver.port=${PORT:-8080} \
   -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-prod} \
   -jar app.jar"]
