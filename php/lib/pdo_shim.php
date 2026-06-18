<?php

require_once __DIR__ . '/sql.php';

class PgResult
{
    private int $index = 0;

    public int $num_rows;

    public function __construct(private array $rows)
    {
        $this->num_rows = count($rows);
    }

    public function fetch_assoc(): ?array
    {
        if ($this->index >= count($this->rows)) {
            return null;
        }

        return $this->rows[$this->index++];
    }
}

class PgStatement
{
    private PDOStatement $stmt;

    private array $params = [];

    private array $resultRows = [];

    public int $insert_id = 0;

    public ?string $error = null;

    private bool $isInsert = false;

    public function __construct(private PDO $pdo, string $sql)
    {
        $this->isInsert = (bool) preg_match('/^\s*INSERT\s+INTO\s+/i', trim($sql));
        $pgSql = pg_prepare_insert(pg_quote_camel_identifiers($sql));
        $this->stmt = $pdo->prepare($pgSql);
    }

    public function bind_param(string $types, &...$vars): bool
    {
        $this->params = $vars;
        return true;
    }

    public function execute(): bool
    {
        try {
            $ok = $this->stmt->execute($this->params);

            if ($this->isInsert) {
                $row = $this->stmt->fetch(PDO::FETCH_ASSOC);
                if ($row && isset($row['id'])) {
                    $this->insert_id = (int) $row['id'];
                }
                return $ok;
            }

            $this->resultRows = $this->stmt->fetchAll(PDO::FETCH_ASSOC);
            return $ok;
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function get_result(): PgResult
    {
        return new PgResult($this->resultRows);
    }

    public function close(): void
    {
    }
}

class PgConnection
{
    public ?string $error = null;

    public ?string $connect_error = null;

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public static function fromDatabaseUrl(string $databaseUrl): self
    {
        $parts = parse_url($databaseUrl);
        if ($parts === false || empty($parts['host'])) {
            throw new RuntimeException('DATABASE_URL inválida');
        }

        $host = $parts['host'];
        $port = $parts['port'] ?? 5432;
        $dbname = ltrim($parts['path'] ?? '/postgres', '/');
        $user = urldecode($parts['user'] ?? '');
        $password = urldecode($parts['pass'] ?? '');
        $ssl = getenv('DB_SSL') === 'false' ? 'disable' : 'require';

        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode={$ssl}";

        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        return new self($pdo);
    }

    public function prepare(string $sql): PgStatement|false
    {
        try {
            return new PgStatement($this->pdo, $sql);
        } catch (PDOException $e) {
            $this->error = $e->getMessage();
            return false;
        }
    }

    public function set_charset(string $charset): void
    {
    }
}
