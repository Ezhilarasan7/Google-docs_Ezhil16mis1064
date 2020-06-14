CREATE TABLE users
(
       id UUID NOT NULL,
       name varchar(60) not null,
       email varchar(128) not null UNIQUE,
       password text,
       created_at TIMESTAMP DEFAULT now(),
       viewing_currently boolean DEFAULT false,
       PRIMARY KEY (id)
);

insert into users (id, name, email, password) 
values ('07bf0a69-ccc2-4133-904c-9395318039d8', 'ram', 'ram@gmail.com', '$2a$08$q20DKio8Jax0tK5zhuiyAuyMn8GUP01ggvoQ8lmnB3j3q4wr7zye6');

create table visits (
       name text,
       viewing_currently boolean DEFAULT false
);

create table doc (
       content text
);