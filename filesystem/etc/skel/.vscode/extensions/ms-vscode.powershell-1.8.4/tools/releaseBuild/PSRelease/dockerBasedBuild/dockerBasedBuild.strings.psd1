@{
    dockerfile=@'
    # escape=`
    FROM {0}
    
    COPY {1} {2}
    
'@
}
