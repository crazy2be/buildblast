Shared
----------------------------
Everything in shared should have no dependencies outside of shared. Once things reach a reasonable size within themselves, they should be moved out of shared (EX, if Conn also implemented gzip, and handled throttling).