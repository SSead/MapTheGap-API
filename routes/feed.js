const express = require('express')
const check_user_access_token = require('../middleware/check_user_access_token')

const router = express.Router()

//Postgres connection
const client = require('../db/client').client



//Endpoints
router.get('/', check_user_access_token, (req, res) => {
    sql_command =  `SELECT i.id, u.country FROM issues i, users u WHERE u.id=${req.userId} `;

    if (req.query.user_id) {
        sql_command += ` AND i.created_by=${req.query.user_id} `;
    }

    sql_command = `SELECT * FROM (${sql_command}) a, detailed_issue(a.id, ${req.userId}) b WHERE b.country = a.country`;

    if (req.query.sort_by) {
        const sort_var = req.query.sort_by.substring(0, req.query.sort_by.indexOf(':'))
        const sort_dir = req.query.sort_by.substring(req.query.sort_by.indexOf(':') + 1)
        switch (sort_var) {
            case 'date':
                sql_command += ` ORDER BY b.created_at ${sort_dir}`
                break;
            case 'supported':
                sql_command += ` ORDER BY b.supported ${sort_dir}`
                break;
            case 'upvotes':
                sql_command += ` ORDER BY b.upvotes ${sort_dir}`
        }
    }

    sql_command += ' LIMIT 10'

    

    if (req.query.page) {
        sql_command += ` OFFSET ${(req.query.page - 1) * 10} ROWS`
    }

    

    console.log(sql_command)

    client.query(sql_command).then(result => {
        if (result.rows) {
            res.status(200).send({
                success: true, 
                request_id: Math.random().toString(36).substring(3),
    
                data: {
                    issue: result.rows
                }
            })
        } else throw {detail: "Id does not exist"}
    }).catch(error => {
        //Error
        console.log(error)
        res.status(400).send({
            success: false,
            request_id: Math.random().toString(36).substring(3),

            data: {},

            error: {
                message: error.detail,
                code: error.code
            }
        })
    })
})

//Export
module.exports = router