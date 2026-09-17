<?php
declare(strict_types=1);

// CLI only; its PostgreSQL role can read the aggregate view and nothing else.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}
try {
    $required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    foreach ($required as $key) {
        if (getenv($key) === false || getenv($key) === '') {
            throw new RuntimeException('Missing configuration');
        }
    }
    foreach (['DB_HOST', 'DB_NAME'] as $key) {
        if (!preg_match('/^[a-zA-Z0-9_.-]+$/', (string) getenv($key))) {
            throw new RuntimeException('Invalid configuration');
        }
    }
    if (!ctype_digit((string) getenv('DB_PORT'))) {
        throw new RuntimeException('Invalid port');
    }
    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', getenv('DB_HOST'), getenv('DB_PORT'), getenv('DB_NAME'));
    $db = new PDO($dsn, (string) getenv('DB_USER'), (string) getenv('DB_PASSWORD'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->beginTransaction();
    $db->exec('SET TRANSACTION READ ONLY');
    $rows = $db->query('SELECT id,name,status,pyapy_reservations,reserved_amount_pyg FROM administrative_property_report ORDER BY name')->fetchAll(PDO::FETCH_ASSOC);
    $db->commit();
    echo json_encode(['properties' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
} catch (Throwable $error) {
    fwrite(STDERR, "No se pudo generar el informe administrativo. Revisar configuracion y permisos.\n");
    exit(1);
}
