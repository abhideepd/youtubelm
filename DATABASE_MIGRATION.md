# Database Migration Guide: H2 → PostgreSQL

## Phase 1: Development (Current)
- **Database**: H2 (File-based)
- **Persistence**: Auto-migrates schema on startup
- **Configuration**: `application.properties`

## Phase 2: Production (Future)
- **Database**: PostgreSQL
- **Persistence**: Validated schema only
- **Configuration**: `application-prod.properties`

## Migration Steps

### Step 1: Prepare Production Database

```bash
# Create PostgreSQL database
createdb ytlearner

# Create user (optional, if using different user)
createuser ytlearner_user
```

### Step 2: Backup Development Data (Optional)

```bash
# Export H2 data to SQL
java -cp h2-*.jar org.h2.tools.Shell \
  -driver org.h2.Driver \
  -url jdbc:h2:./ytlearner-db \
  -user sa \
  -password "" < export.sql

# Import to PostgreSQL
psql -U postgres -d ytlearner < export.sql
```

### Step 3: Update Application Configuration

**Before:**
```bash
# application.properties (Development)
spring.profiles.active=dev
spring.datasource.url=jdbc:h2:file:./ytlearner-db;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.driver-class-name=org.h2.Driver
```

**After:**
```bash
# application-prod.properties (Production)
spring.profiles.active=prod
spring.datasource.url=jdbc:postgresql://your-host:5432/ytlearner
spring.datasource.driver-class-name=org.postgresql.Driver
```

### Step 4: Launch with Production Profile

```bash
# Using Spring Boot
java -jar app.jar --spring.profiles.active=prod

# Using Gradle
./gradlew bootRun --args='--spring.profiles.active=prod'

# Docker
docker run -e SPRING_PROFILES_ACTIVE=prod -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/ytlearner my-app
```

### Step 5: Database Migration Tool Setup (Optional)

For larger schema changes in the future, use **Flyway** or **Liquibase**:

```gradle
// Add to build.gradle
implementation 'org.flywaydb:flyway-core:9.22.3'
```

Create migration files in `src/main/resources/db/migration/`:
```
V1__Initial_Schema.sql
V2__Add_User_Table.sql
V3__Add_OAuth_Columns.sql
```

## No Code Changes Required! ✅

All entities, repositories, and services work with **both** H2 and PostgreSQL without modification because:

1. **JPA Abstraction**: Hibernate handles database-specific SQL
2. **HikariCP Connection Pool**: Works with both databases
3. **Spring Boot Auto-Config**: Detects PostgreSQL driver and configures automatically

## Environment Variables (Production)

Create `.env` file or set in your deployment:

```env
# Database
DB_HOST=your-postgres-server.com
DB_PORT=5432
DB_NAME=ytlearner
DB_USER=postgres
DB_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-256-bit-secret-key-change-this-in-prod

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret

# APIs
GEMINI_API_KEY=your-gemini-key
YOUTUBE_API_KEY=your-youtube-key
```

## Verification Checklist

- [ ] New PostgreSQL database created
- [ ] Connection parameters configured in `application-prod.properties`
- [ ] Environment variables set in deployment
- [ ] Test database connection: `psql -U postgres -d ytlearner -c "SELECT 1"`
- [ ] Application starts with `--spring.profiles.active=prod`
- [ ] `/api/auth/login` endpoint works
- [ ] `/h2-console` disabled in production (remove `spring.h2.console.enabled=true`)

## Rollback Plan

If production migration fails:

1. Keep H2 database backup
2. Switch `spring.profiles.active` back to `dev`
3. Restart application
4. Investigate PostgreSQL connection issue
5. Fix and retry

## Performance Tuning (PostgreSQL)

```sql
-- Create indexes for common queries
CREATE INDEX idx_users_youtube_id ON users(youtube_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_questions_video_id ON questions(video_id);
CREATE INDEX idx_quiz_results_username ON quiz_results(username);

-- Connection pooling (Hikari)
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

---

**Estimated Migration Time**: ~15 minutes with zero downtime ✅
