<?php

function pg_quote_camel_identifiers(string $sql): string
{
    $identifiers = [
        'firstName',
        'lastName',
        'passwordHash',
        'googleId',
        'createdAt',
        'ownerId',
        'classId',
        'userId',
        'joinedAt',
        'isCopy',
        'originalId',
    ];

    foreach ($identifiers as $id) {
        $pattern = '/(?<!["a-zA-Z])' . preg_quote($id, '/') . '(?!["a-zA-Z])/';
        $sql = preg_replace($pattern, '"' . $id . '"', $sql);
    }

    return $sql;
}

function pg_prepare_insert(string $sql): string
{
    if (preg_match('/^\s*INSERT\s+INTO\s+/i', $sql) && !preg_match('/\bRETURNING\b/i', $sql)) {
        return rtrim($sql, ";\t\n\r ") . ' RETURNING id';
    }

    return $sql;
}
